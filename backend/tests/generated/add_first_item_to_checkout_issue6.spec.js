import { test, expect } from '@playwright/test';
import { addFirstItemToCart, goToCart, getCartItemPrice } from '../utils/utils.js';

test.describe('Add first item to checkout', () => {
  test('should add the first item and validate $29.99 in cart', async ({ page }) => {
    await page.goto('/inventory.html');

    // Add the first item to the cart
    await addFirstItemToCart(page);

    // Navigate to cart
    await goToCart(page);

    // Validate price
    const price = await getCartItemPrice(page, 0);
    expect(price).toBe('$29.99');
  });
});