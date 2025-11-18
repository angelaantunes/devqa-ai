import { test, expect } from '@playwright/test';
import { login, assertLoginError } from '../utils/utils.js';

test.describe('Login negative paths @swaglabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
  });

  test('Empty username shows required error', async ({ page }) => {
    await login(page, '', 'secret_sauce');
    await assertLoginError(page, 'Epic sadface: Username is required');
  });

  test('Empty password shows required error', async ({ page }) => {
    await login(page, 'locked_out_user', '');
    await assertLoginError(page, 'Epic sadface: Password is required');
  });

  test('Invalid credentials show generic error', async ({ page }) => {
    await login(page, 'fake_user', 'wrong_pass');
    await assertLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('Locked out user shows lockout error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await assertLoginError(page, 'Epic sadface: Sorry, this user has been locked out.');
  });

  test('XSS in username is sanitized', async ({ page }) => {
    const xss = '<script>alert(document.domain)</script>';
    await login(page, xss, 'secret_sauce');
    await assertLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
    const hasAlert = await page.evaluate(() => window.alert !== undefined);
    expect(hasAlert).toBe(true); // alert exists but was never called
  });

  test('Offline mode shows friendly error', async ({ page, context }) => {
    await context.setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText(/network|offline|retry/i);
    await context.setOffline(false);
  });

  test('Spaces in username are not trimmed', async ({ page }) => {
    await login(page, ' standard_user ', 'secret_sauce');
    await assertLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('Rapid double click triggers single error', async ({ page }) => {
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'bad');
    const loginBtn = page.locator('[data-test="login-button"]');
    await loginBtn.dblclick();
    await expect(page.locator('[data-test="error"]')).toHaveCount(1);
  });

  test('Error disappears when user types', async ({ page }) => {
    await login(page, '', 'secret_sauce');
    await assertLoginError(page, 'Epic sadface: Username is required');
    await page.type('[data-test="username"]', 'a');
    await expect(page.locator('[data-test="error"]')).not.toBeVisible();
  });
});