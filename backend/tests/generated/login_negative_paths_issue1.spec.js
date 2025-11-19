import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test.describe('Login negative paths', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
  });

  test('Empty username shows error', async ({ page }) => {
    await login(page, '', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('Empty password shows error', async ({ page }) => {
    await login(page, 'standard_user', '');
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('Locked user shows error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out');
  });

  test('Invalid credentials show error', async ({ page }) => {
    await login(page, 'fake_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });

  test('SQL injection attempt fails safely', async ({ page }) => {
    const payload = "admin' OR '1'='1";
    await login(page, payload, payload);
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });

  test('XSS payload is escaped', async ({ page }) => {
    const xss = '<script>alert(1)</script>';
    await login(page, xss, 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
    const text = await page.textContent('body');
    expect(text).not.toContain('<script>');
  });

  test('Long username handled gracefully', async ({ page }) => {
    const long = 'a'.repeat(1000);
    await login(page, long, 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });

  test('Enter key with invalid creds shows error', async ({ page }) => {
    await page.fill('[data-test="username"]', 'invalid');
    await page.fill('[data-test="password"]', 'invalid');
    await page.press('[data-test="password"]', 'Enter');
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });

  test('Offline mode shows error', async ({ page, context }) => {
    await context.setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Username and password do not match');
  });
});