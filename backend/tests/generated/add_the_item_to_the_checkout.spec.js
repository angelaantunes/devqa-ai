import { test, expect } from '@playwright/test';
import { login, addFirstItemToCart, openCart, verifyCartItemPrice, checkout } from '../utils/utils.js';

test.describe('Add first item to cart and verify $29.99 in checkout', () => {
  test('should add first item to cart and verify $29.99 in checkout', async ({ page }) => {
    await login(page);

    const firstItemPrice = await addFirstItemToCart(page);
    expect(firstItemPrice).toBe('$29.99');

    await openCart(page);
    await verifyCartItemPrice(page, '$29.99');

    await checkout(page);

    // Final assertion on the overview page
    const itemPrice = page.locator('.cart_item .inventory_item_price');
    await expect(itemPrice).toHaveText('$29.99');
  });
});