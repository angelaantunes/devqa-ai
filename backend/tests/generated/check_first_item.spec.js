import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test.describe('Inventory Page - First Item Validation', () => {
  test('First item should have title "Sauce Labs Backpack" and price "$29.99"', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
    await login(page, 'standard_user', 'secret_sauce');

    // Wait for inventory list to appear
    await expect(page).toHaveURL(/.*inventory\.html?/);
    const firstItem = page.locator('.inventory_item').first();
    await expect(firstItem).toBeVisible();

    // Validate title
    const title = firstItem.locator('.inventory_item_name');
    await expect(title).toHaveText('Sauce Labs Backpack');

    // Validate price
    const price = firstItem.locator('.inventory_item_price');
    await expect(price).toHaveText('$29.99');
  });
});