import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';


test.describe("Check first item title and price after successful login", () => {
  test('Check first item title and price after successful login', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
    await login(page, 'standard_user', 'secret_sauce');
  
    // Ensure we are on the inventory page
    await expect(page).toHaveURL(/.*\/inventory\.html?/);
  
    // Get the first inventory item
    const firstItem = page.locator('.inventory_item').first();
    await expect(firstItem).toBeVisible();
  
    // Check title
    const title = firstItem.locator('.inventory_item_name');
    await expect(title).toHaveText('Sauce Labs Backpack');
  
    // Check price
    const price = firstItem.locator('.inventory_item_price');
    await expect(price).toHaveText('$29.99');
  });
});