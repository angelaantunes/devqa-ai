import { test, expect } from '@playwright/test';
import { addFirstItemToCart, goToCart, getCartItemPrice } from '../utils/utils.js';

test.describe('Add first item to cart and validate price in checkout', () => {
  test('should add the first item and verify $29.99 in cart', async ({ page }) => {
    await page.goto('/inventory.html');

    // Add first item to cart
    await addFirstItemToCart(page);

    // Navigate to cart
    await goToCart(page);

    // Validate price
    const price = await getCartItemPrice(page);
    expect(price).toBe('$29.99');
  });
});