import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';


test.describe("Check first item title and price after successful login", () => {
  test('Check first item title and price after successful login', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  
    const firstItem = page.locator('.inventory_item').first();
    await expect(firstItem).toBeVisible();
  
    const itemTitle = firstItem.locator('.inventory_item_name');
    await expect(itemTitle).toHaveText('Sauce Labs Backpack');
  
    const itemPrice = firstItem.locator('.inventory_item_price');
    await expect(itemPrice).toHaveText('$69.99');
  });
});