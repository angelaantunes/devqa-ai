import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test('Login with standard_user should succeed', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await expect(page).toHaveTitle(/Swag Labs/);

  await login(page, 'standard_user', 'secret_sauce');

  await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
  await expect(page.locator('[data-test="title"]')).toHaveText('Products');
});