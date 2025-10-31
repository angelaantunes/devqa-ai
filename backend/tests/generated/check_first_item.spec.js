import { test, expect } from '@playwright/test';
import { login, logout, getFirstInventoryItem } from '../utils/utils.js';

test.describe('Inventory page - first item validation', () => {
  test('First item should have title "Sauce Labs Backpack" and price $29.99', async ({ page }) => {
    await page.goto('https://www.saucedemo.com/');
    await login(page, 'standard_user', 'secret_sauce');

    const { title, price } = await getFirstInventoryItem(page);
    expect(title).toBe('Sauce Labs Backpack');
    expect(price).toBe('$29.99');

    await logout(page);
  });
});