import { test, expect } from '@playwright/test';
import { login } from '../utils/utils.js';

test.describe('Login negative paths @swaglabs', () => {
  const url = 'https://www.saucedemo.com/';

  test.beforeEach(async ({ page }) => {
    await page.goto(url);
  });

  test('Empty username shows required error', async ({ page }) => {
    await login(page, '', '');
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('Empty password shows required error', async ({ page }) => {
    await login(page, 'standard_user', '');
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('Invalid credentials show mismatch error', async ({ page }) => {
    await login(page, 'bad_user', 'wrong123');
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  test('Locked user shows locked error', async ({ page }) => {
    await login(page, 'locked_out_user', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out.');
  });

  test('Username with leading/trailing spaces fails', async ({ page }) => {
    await login(page, ' standard_user ', 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  test('Password with leading/trailing spaces fails', async ({ page }) => {
    await login(page, 'standard_user', ' secret_sauce ');
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  test('Very long username handled gracefully', async ({ page }) => {
    const longUser = 'a'.repeat(500);
    await login(page, longUser, 'secret_sauce');
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  test('Very long password handled gracefully', async ({ page }) => {
    const longPass = 'b'.repeat(500);
    await login(page, 'standard_user', longPass);
    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service'
    );
  });

  test('Offline mode blocks login', async ({ page, context }) => {
    await context.setOffline(true);
    await login(page, 'standard_user', 'secret_sauce');
    await expect(page).toHaveURL(url);
    await expect(page.locator('[data-test="error"]')).toBeVisible();
  });

  test('Rapid double click sends only one request', async ({ page }) => {
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.dblclick('[data-test="login-button"]');
    // If login succeeded we would be on inventory.html; negative test expects failure
    await expect(page).toHaveURL(url);
  });

  test('Enter key does not log in', async ({ page }) => {
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.press('[data-test="password"]', 'Enter');
    await expect(page).toHaveURL(url);
  });

  test('Back button after login clears session', async ({ page }) => {
    await login(page, 'standard_user', 'secret_sauce');
    // Should succeed, then we go back to force negative state
    await expect(page).toHaveURL(/.*inventory.html/);
    await page.goBack();
    await expect(page).toHaveURL(url);
    await page.goto('https://www.saucedemo.com/inventory.html');
    // Inventory should redirect to login when session missing
    await expect(page).toHaveURL(url);
  });
});