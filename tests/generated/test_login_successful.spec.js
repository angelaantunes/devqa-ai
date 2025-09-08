import { test, expect } from '@playwright/test';
import { openPage, login, verifyNavigation } from '../utils/utils.js';

test('Test Login Successful', async ({ page }) => {
    await openPage(page, 'https://www.saucedemo.com/');
    await login(page, 'standard_user', 'secret_sauce');
    await verifyNavigation(page, 'https://www.saucedemo.com/inventory.html');
});