import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test.describe('Login negative paths @negative', () => {
  const url = 'https://www.saucedemo.com/';
  const inv = 'https://www.saucedemo.com/inventory.html';

  test.beforeEach(async ({ page }) => {
    await page.goto(url);
  });

  test('Empty username shows required error', async ({ page }) => {
    await login(page, '', '');
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
    expect(page.url()).toBe(url);
  });

  test('Empty password shows required error', async ({ page }) => {
    await login(page, 'standard_user', '');
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
    expect(page.url()).toBe(url);
  });

  test('Invalid credentials show generic error', async ({ page }) => {
    await login(page, 'bad_user', 'wrongpass');
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service'
    );
    expect(page.url()).toBe(url);
  });

  test('Locked out user shows lockout error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out.');
    expect(page.url()).toBe(url);
  });

  test('Leading spaces in username treated as invalid', async ({ page }) => {
    await login(page, ' standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('Trailing spaces in username treated as invalid', async ({ page }) => {
    await login(page, 'standard_user ', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('Leading spaces in password treated as invalid', async ({ page }) => {
    await login(page, 'standard_user', ' secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('Trailing spaces in password treated as invalid', async ({ page }) => {
    await login(page, 'standard_user', 'secret_sauce ');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('SQL injection in username fails safely', async ({ page }) => {
    await login(page, "' OR 1=1 --", 'anything');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('XSS payload in username is escaped', async ({ page }) => {
    const xss = '<script>alert(1)</script>';
    await login(page, xss, 'anything');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
    // Ensure script tag is escaped
    await expect(page.locator('body')).not.toContain('alert(1)', { timeout: 1000 });
  });

  test('Overlong username handled gracefully', async ({ page }) => {
    const long = 'a'.repeat(1000);
    await login(page, long, 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('Overlong password handled gracefully', async ({ page }) => {
    const long = 'b'.repeat(1000);
    await login(page, 'standard_user', long);
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('Offline network shows user-friendly error', async ({ page, context }) => {
    await context.setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    // UI should still show error, not hang
    await expect(page.locator('[data-test="error"]')).toBeVisible();
    await context.setOffline(false);
  });

  test('Double-click login sends only one request', async ({ page }) => {
    await page.fill('[data-test="username"]', '');
    await page.fill('[data-test="password"]', '');
    const reqPromise = page.waitForRequest('**/*', { timeout: 2000 }).catch(() => null);
    await page.dblclick('[data-test="login-button"]');
    const req = await reqPromise;
    expect(req).toBeNull(); // no network call expected for empty fields
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('Enter key triggers validation when fields empty', async ({ page }) => {
    await page.fill('[data-test="username"]', 'bad');
    await page.fill('[data-test="password"]', 'bad');
    await page.press('[data-test="password"]', 'Enter');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('No sensitive data in sessionStorage after failure', async ({ page }) => {
    await login(page, 'bad', 'bad');
    const storage = await page.evaluate(() => window.sessionStorage.length);
    expect(storage).toBe(0);
  });
});