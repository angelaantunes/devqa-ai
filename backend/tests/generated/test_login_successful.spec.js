import { test, expect } from '@playwright/test';
import { login, checkLoginError } from '../utils/utils.js';

test.describe('Login negative paths @login @negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
  });

  test('Empty username shows required error', async ({ page }) => {
    await login(page, '', '');
    await checkLoginError(page, 'Epic sadface: Username is required');
  });

  test('Empty password shows required error', async ({ page }) => {
    await login(page, 'standard_user', '');
    await checkLoginError(page, 'Epic sadface: Password is required');
  });

  test('Invalid credentials show generic error', async ({ page }) => {
    await login(page, 'bad_user', 'wrong123');
    await checkLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('Locked-out user shows lockout error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await checkLoginError(page, 'Epic sadface: Sorry, this user has been locked out.');
  });

  test('SQL injection handled gracefully', async ({ page }) => {
    await login(page, "' OR 1=1--", 'password');
    await checkLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('XSS payload escaped', async ({ page }) => {
    const xss = '<script>alert(1)</script>';
    await login(page, xss, 'password');
    await checkLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
    const userInput = page.locator('[data-test="username"]');
    await expect(userInput).toHaveValue(xss);
  });

  test('Very long username handled', async ({ page }) => {
    const long = 'a'.repeat(1000);
    await login(page, long, 'secret_sauce');
    await checkLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('Very long password handled', async ({ page }) => {
    const long = 'b'.repeat(1000);
    await login(page, 'standard_user', long);
    await checkLoginError(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('Offline network shows error', async ({ page, context }) => {
    await context.setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText(/network|fetch|Failed to fetch/i);
  });

  test('Double-click login sends single request', async ({ page }) => {
    let requestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('auth')) requestCount += 1;
    });
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.dblclick('[data-test="login-button"]');
    await page.waitForURL('**/inventory.html');
    expect(requestCount).toBe(1);
  });

  test('Enter key login works', async ({ page }) => {
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.press('[data-test="password"]', 'Enter');
    await page.waitForURL('**/inventory.html');
  });

  test('500 on auth endpoint shows error', async ({ page }) => {
    await page.route('**/auth', (route) => route.abort('failed'));
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText(/Sorry|error|problem/i);
  });
});