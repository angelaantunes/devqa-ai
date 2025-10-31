import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test('First inventory item has correct title and price', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await login(page, 'standard_user', 'secret_sauce');

  // Wait for inventory page
  await expect(page).toHaveURL(/.*\/inventory\.html?$/);

  // Get first item card
  const firstItem = page.locator('.inventory_item').first();
  await expect(firstItem).toBeVisible();

  // Check title
  const title = firstItem.locator('.inventory_item_name');
  await expect(title).toHaveText('Sauce Labs Backpack');

  // Check price
  const price = firstItem.locator('.inventory_item_price');
  await expect(price).toHaveText('$29.99');
});