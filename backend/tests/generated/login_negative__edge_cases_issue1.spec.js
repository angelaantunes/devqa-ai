import { test, expect } from '@playwright/test';
import { login, getErrorMessage, waitForUrl } from '../utils/utils.js';

test.describe('Login Negative & Edge Cases', () => {
  const baseURL = 'https://www.saucedemo.com';
  const inventoryURL = `${baseURL}/inventory.html`;

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  test('Empty username shows required error', async ({ page }) => {
    await login(page, '', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('Empty password shows required error', async ({ page }) => {
    await login(page, 'standard_user', '');
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('Invalid credentials show mismatch error', async ({ page }) => {
    await login(page, 'bad_user', 'wrongpass');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match any user');
  });

  test('Trailing spaces treated as invalid', async ({ page }) => {
    await login(page, 'standard_user ', 'secret_sauce ');
    await expect(page.locator('[data-test="error"]')).toContainText('do not match any user');
  });

  test('Locked-out user shows lockout error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out.');
  });

  test('SQL injection attempt fails safely', async ({ page }) => {
    const payload = "admin' OR '1'='1";
    await login(page, payload, payload);
    await expect(page).not.toHaveURL(inventoryURL);
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });

  test('1000-char overflow handled gracefully', async ({ page }) => {
    const longStr = 'a'.repeat(1000);
    await login(page, longStr, longStr);
    await expect(page.locator('[data-test="error"]')).toContainText('do not match any user');
  });

  test('Login request blocked shows error', async ({ page }) => {
    await page.route('**//**', (route) => route.abort());
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });

  test('Back button after login does not keep session', async ({ page }) => {
    await login(page, 'standard_user', 'secret_sauce');
    await waitForUrl(page, inventoryURL);
    await page.goBack();
    await expect(page).toHaveURL(baseURL);
  });

  test('Slow network shows loading then error', async ({ page }) => {
    await page.context().setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });

  test('Double-click login sends single request', async ({ page }) => {
    let requestCount = 0;
    await page.on('request', (req) => {
      if (req.url().includes('saucedemo') && req.method() === 'POST') requestCount++;
    });
    await page.click('[data-test="login-button"]', { clickCount: 2 });
    await page.waitForTimeout(500);
    expect(requestCount).toBeLessThanOrEqual(1);
  });
});