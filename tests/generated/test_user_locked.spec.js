import { test, expect } from '@playwright/test';

test('Test User Locked', async ({ page }) => {
    // Navigate to the Swag Labs page
    await page.goto('https://www.saucedemo.com/');
    
    // Input the locked out username
    await page.fill('input[placeholder="Username"]', 'locked_out_user');
    
    // Input the password
    await page.fill('input[placeholder="Password"]', 'secret_sauce');
    
    // Click the login button
    await page.click('input[type="submit"]');
    
    // Assert that the error message is displayed
    const errorMessage = await page.locator('.error-message-container');
    await expect(errorMessage).toHaveText('Epic sadface: Sorry, this user has been locked out.');
});