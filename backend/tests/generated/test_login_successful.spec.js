import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test('successful login', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await login(page, 'standard_user', 'secret_sauce');
  await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
});