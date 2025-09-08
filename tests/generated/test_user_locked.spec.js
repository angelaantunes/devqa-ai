import { test, expect } from '@playwright/test';
import { openPage, fillInput, clickButton, getErrorMessage, login } from '../utils/utils.js';

test('Test User Locked', async ({ page }) => {
    await openPage(page, 'https://www.saucedemo.com/');
    await login(page, 'locked_out_user', 'secret_sauce');
    const errorMessage = await getErrorMessage(page);
    expect(errorMessage).toBe('Epic sadface: Sorry, this user has been locked out.');
});