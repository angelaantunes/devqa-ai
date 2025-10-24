import { test, expect } from '@playwright/test';
import { addFirstItemToCart, goToCart, getCartItemPrice } from '../utils/utils.js';

test('Add the first item to the checkout and validate $29.99', async ({ page }) => {
  await page.goto('/inventory.html');
  await expect(page.locator('[data-test="inventory-item"]')).toHaveCount(1);

  await addFirstItemToCart(page);
  await goToCart(page);

  const price = await getCartItemPrice(page, 0);
  expect(price).toBe('$29.99');
});