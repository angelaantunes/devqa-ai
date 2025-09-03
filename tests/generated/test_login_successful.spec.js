import { test, expect } from '@playwright/test';

test('Test Login Successful', async ({ page }) => {
  // Step 1: Navigate to the Swag Labs login page
  await page.goto('https://www.saucedemo.com/');

  // Step 2: Enter the username
  await page.fill('input[placeholder="Username"]', 'standard_user');

  // Step 3: Enter the password
  await page.fill('input[placeholder="Password"]', 'secret_sauce');

  // Step 4: Click the login button
  await page.click('input[type="submit"]');

  // Step 5: Verify that the user is redirected to the inventory page
  await expect(page).toHaveURL('https://www.saucedemo.com/inventory.html');
});