import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test('Check first item title and price', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await login(page, 'standard_user', 'secret_sauce');
  await expect(page).toHaveURL(/.*inventory/);
  const firstItem = page.locator('.inventory_item').first();
  const title = firstItem.locator('.inventory_item_name');
  const price = firstItem.locator('.inventory_item_price');
  await expect(title).toHaveText('Sauce Labs Backpack');
  await expect(price).toHaveText('$29.99');
});