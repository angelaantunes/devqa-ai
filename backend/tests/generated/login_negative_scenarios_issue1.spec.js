import { test, expect } from '@playwright/test';
import { login, assertErrorMessage } from '../utils/utils.js';

test.describe('Login negative scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
  });

  test('empty username shows error', async ({ page }) => {
    await login(page, '', 'secret_sauce');
    await assertErrorMessage(page, 'Epic sadface: Username is required');
  });

  test('empty password shows error', async ({ page }) => {
    await login(page, 'standard_user', '');
    await assertErrorMessage(page, 'Epic sadface: Password is required');
  });

  test('invalid credentials show generic error', async ({ page }) => {
    await login(page, 'locked_out_user', 'wrongpass');
    await assertErrorMessage(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('SQL injection fails gracefully', async ({ page }) => {
    const payload = "admin' OR '1'='1";
    await login(page, payload, payload);
    await assertErrorMessage(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('very long username and password', async ({ page }) => {
    const long = 'a'.repeat(1000);
    await login(page, long, long);
    await assertErrorMessage(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('network offline shows client error', async ({ page, context }) => {
    await context.setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText(/network|offline|failed/i);
  });

  test('rapid click sends only one request', async ({ page }) => {
    let requestCount = 0;
    page.on('request', req => {
      if (req.url().includes('login')) requestCount++;
    });
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await Promise.all([
      page.click('[data-test="login-button"]', { clickCount: 5 }),
      page.waitForResponse(resp => resp.url().includes('login') && resp.status() === 200)
    ]);
    expect(requestCount).toBe(1);
  });

  test('server 500 returns generic error', async ({ page }) => {
    await page.route('**/login', route => route.abort('failed'));
    await login(page, 'standard_user', 'secret_sauce');
    await assertErrorMessage(page, 'Epic sadface: Username and password do not match any user in this service');
  });

  test('back button after login redirects to login', async ({ page }) => {
    await login(page, 'standard_user', 'secret_sauce');
    await page.waitForURL('**/inventory.html');
    await page.goBack();
    await expect(page).toHaveURL(/.*saucedemo\.com\/$/);
  });

  test('direct visit to inventory without login redirects', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/inventory.html');
    await expect(page).toHaveURL(/.*saucedemo\.com\/$/);
  });
});