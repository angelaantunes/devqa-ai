import { test, expect } from '@playwright/test';
import { addFirstItemToCart, goToCart, getCartItemCount, getCartItemPrice } from '../utils/utils.js';

test.describe('Add first item to checkout', () => {
  test('Add the first item to the bag and validate $29.99 in cart', async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page.locator('.inventory_item')).toHaveCountGreaterThan(0);

    await addFirstItemToCart(page);
    await goToCart(page);

    const count = await getCartItemCount(page);
    expect(count).toBe(1);

    const price = await getCartItemPrice(page, 0);
    expect(price).toBe('$29.99');
  });
});