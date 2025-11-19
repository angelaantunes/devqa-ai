import { test, expect } from '@playwright/test';
import { addFirstItemToCart, openCart, getCartBadge, getItemPrice, removeCartFromLocalStorage } from '../utils/utils.js';

test.describe('Negative flow: add item to checkout', () => {
  test('should NOT show $29.99 in cart after adding first item', async ({ page }) => {
    await page.goto('/inventory.html', { waitUntil: 'networkidle' });

    // Ensure at least one item exists
    const firstAddButton = page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').first();
    await expect(firstAddButton).toBeVisible();

    // Simulate network failure on add
    await page.route('**/cart', route => route.abort('failed'));
    await firstAddButton.click();
    await expect(firstAddButton).toHaveText('Add to cart'); // still visible due to failure

    // Re-enable network and retry
    await page.unroute('**/cart');
    await firstAddButton.click();
    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');

    // Navigate to cart and assert negative price
    await openCart(page);
    const price = await getItemPrice(page);
    expect(price).not.toBe('$29.99');

    // Edge case: remove cart from localStorage and refresh
    await removeCartFromLocalStorage(page);
    await page.reload();
    expect(await getCartBadge(page)).toBe(0);
  });
});