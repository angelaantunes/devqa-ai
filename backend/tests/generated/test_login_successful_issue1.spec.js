import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';


test.describe("Test Login Successful", () => {
  test('Test Login Successful', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });
});