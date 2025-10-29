import { test, expect } from '@playwright/test';
import { addFirstItemToCart, goToCart, getCartItemPrice } from '../utils.js';

test.describe('Add first item to checkout', () => {
  test('should add the first $29.99 item to cart and verify it in checkout', async ({ page }) => {
    await page.goto('/inventory.html');

    // Add the first item to cart
    await addFirstItemToCart(page, '29.99');

    // Navigate to cart
    await goToCart(page);

    // Verify price in cart
    const price = await getCartItemPrice(page, 1);
    expect(price).toBe('$29.99');
  });
});