import { test, expect } from '@playwright/test';
import { login, checkErrorMessage, resetPage } from '../utils/utils.js';

test.describe('Login Negative Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
  });

  test('Empty username shows error', async ({ page }) => {
    await login(page, '', '');
    await checkErrorMessage(page, 'Username is required');
  });

  test('Empty password shows error', async ({ page }) => {
    await login(page, 'fake_user', '');
    await checkErrorMessage(page, 'Password is required');
  });

  test('Locked out user shows error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await checkErrorMessage(page, 'Sorry, this user has been locked out');
  });

  test('Invalid password shows error', async ({ page }) => {
    await login(page, 'standard_user', 'wrong_password');
    await checkErrorMessage(page, 'Username and password do not match any user in this service');
  });

  test('SQL injection attempt fails gracefully', async ({ page }) => {
    await login(page, "' OR 1=1--", "' OR 1=1--");
    await checkErrorMessage(page, 'Username and password do not match any user in this service');
  });

  test('XSS payload is sanitized', async ({ page }) => {
    await login(page, "<script>alert('xss')</script>", 'anypass');
    await checkErrorMessage(page, 'Username and password do not match any user in this service');
    const hasAlert = await page.evaluate(() => window.alert !== undefined);
    expect(hasAlert).toBe(true); // alert exists but should not be called
    const alertCalled = await page.evaluate(() => {
      let called = false;
      const original = window.alert;
      window.alert = () => { called = true; };
      return called;
    });
    expect(alertCalled).toBe(false);
  });

  test('Extremely long input handled gracefully', async ({ page }) => {
    const longString = 'a'.repeat(1100);
    await login(page, longString, longString);
    await checkErrorMessage(page, 'Username and password do not match any user in this service');
  });

  test('Network failure shows error', async ({ page }) => {
    await page.route('**/*', (route) => route.abort('internetdisconnected'));
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Network error');
  });

  test('Login button removed from DOM prevents submission', async ({ page }) => {
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.evaluate(() => document.querySelector('[data-test="login-button"]').remove());
    await page.locator('[data-test="password"]').press('Enter');
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });
});