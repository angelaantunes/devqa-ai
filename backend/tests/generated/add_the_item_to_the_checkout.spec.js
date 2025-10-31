import { test, expect } from '@playwright/test';
import { addFirstItemToCart, goToCart, getCartItemPrice } from '../utils/utils.js';

test.describe('Add first item to checkout', () => {
  test('should add the first item and validate $29.99 in cart', async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page.locator('.inventory_item')).toHaveCountGreaterThan(0);

    await addFirstItemToCart(page);
    await goToCart(page);

    const price = await getCartItemPrice(page);
    expect(price).toBe('$29.99');
  });
});