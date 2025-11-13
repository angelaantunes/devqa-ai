import { test, expect } from '@playwright/test';
import { loginWithCredentials, getErrorMessage } from '../utils/utils.js';

test('Locked-out user sees correct error message', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await loginWithCredentials(page, 'locked_out_user', 'secret_sauce');
  const message = await getErrorMessage(page);
  expect(message).toBe('Epic sadface: Sorry, this user has been locked out.');
});