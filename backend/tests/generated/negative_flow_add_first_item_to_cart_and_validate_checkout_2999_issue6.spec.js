import { test, expect } from '@playwright/test';
import { addFirstItemToCart, openCart, waitForCartLoaded, getCartBadgeCount, getCartItemPrice, interceptCart500, goOffline, goOnline, deleteCartStorage, changePriceInDOM } from '../utils/utils.js';

test.describe('Negative flow: Add first item to cart and validate checkout ($29.99)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/inventory.html', { waitUntil: 'networkidle' });
    await expect(page.locator('.inventory_item')).toHaveCount(1);
  });

  test('double-click should not duplicate item', async ({ page }) => {
    const btn = page.locator('.inventory_item').first().locator('button:has-text("Add to cart")');
    await btn.dblclick();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
  });

  test('offline mode blocks cart navigation', async ({ page }) => {
    await addFirstItemToCart(page);
    await goOffline(page);
    await openCart(page);
    await expect(page.locator('.error-message')).toContainText(/offline|network/i);
    await goOnline(page);
  });

  test('DOM price tampering reverts to $29.99', async ({ page }) => {
    await addFirstItemToCart(page);
    await changePriceInDOM(page, 0);
    await page.reload();
    await openCart(page);
    await waitForCartLoaded(page);
    const price = await getCartItemPrice(page);
    expect(price).toBe('$29.99');
  });

  test('backend 500 on cart endpoint shows error', async ({ page }) => {
    await interceptCart500(page);
    await addFirstItemToCart(page);
    await openCart(page);
    await expect(page.locator('.error-message')).toContainText(/server|error/i);
  });

  test('cart is user-scoped across tabs', async ({ browser }) => {
    const ctx1 = await browser.newContext();
    const p1 = await ctx1.newPage();
    await p1.goto('/inventory.html');
    await addFirstItemToCart(p1);

    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto('/inventory.html');
    const badge = await getCartBadgeCount(p2);
    expect(badge).toBe(0);

    await ctx1.close();
    await ctx2.close();
  });

  test('expired token redirects to login', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('session-ttl', new Date(Date.now() - 3600_000).toISOString());
    });
    await addFirstItemToCart(page);
    await openCart(page);
    await expect(page).toHaveURL(/.*login/i);
  });

  test('deleting cart storage shows empty cart', async ({ page }) => {
    await addFirstItemToCart(page);
    await deleteCartStorage(page);
    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(0);
  });

  test('invalid SKU does not add item', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('.inventory_item button').dataset.itemId = 'INVALID';
    });
    await addFirstItemToCart(page);
    const badge = await getCartBadgeCount(page);
    expect(badge).toBe(0);
  });
});