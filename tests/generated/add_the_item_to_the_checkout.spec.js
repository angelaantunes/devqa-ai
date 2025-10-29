import { test, expect } from '@playwright/test';
import { addFirstItemToCart, openCart, getCartItemPrice } from '../utils.js';

test.describe('Add first item to cart and verify price', () => {
  test('should add the first item to cart and show $29.99 in checkout', async ({ page }) => {
    // 1. Navigate to inventory page (assumes already logged in)
    await page.goto('https://www.saucedemo.com/inventory.html');

    // 2. Add the first item to cart
    await addFirstItemToCart(page);

    // 3. Open cart
    await openCart(page);

    // 4. Verify price in cart
    const price = await getCartItemPrice(page);
    expect(price).toBe('$29.99');
  });
}