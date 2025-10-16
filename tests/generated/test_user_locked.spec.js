import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test('locked-out user sees correct error message', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await login(page, 'locked_out_user', 'secret_sauce');
  const errorLocator = page.locator('[data-test="error"]');
  await expect(errorLocator).toBeVisible();
  await expect(errorLocator).toHaveText('Epic sadface: Sorry, this user has been locked out.');
});