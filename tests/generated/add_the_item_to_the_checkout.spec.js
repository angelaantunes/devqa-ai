import { test, expect } from '@playwright/test';
import { addFirstItemToCart, openCart, getCartItemPrice } from '../utils/utils.js';

test.describe('Add item to checkout', () => {
  test('should add first item to cart and verify price in checkout', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    const expectedPrice = '$29.99';

    await addFirstItemToCart(page);
    await openCart(page);

    const price = await getCartItemPrice(page);
    expect(price).toBe(expectedPrice);
  });
});