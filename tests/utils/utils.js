export async function login(page, username, password) {
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

export async function postJson(request, url, data) {
  return request.post(url, {
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export function assertCreatedUser(body, expected) {
  const { name, job } = expected;
  expect(body).toHaveProperty('name', name);
  expect(body).toHaveProperty('job', job);
  expect(body).toHaveProperty('id');
  expect(body.id).toBeTruthy();
  expect(body).toHaveProperty('createdAt');
  expect(() => new Date(body.createdAt).toISOString()).not.toThrow();
}

export async function logout(page) {
  await page.click('#react-burger-menu-btn');
  await page.click('[data-test="logout-sidebar-link"]');
}

import { expect } from '@playwright/test';

/**
 * Adds the first item in the inventory list to the cart.
 * @param {import('@playwright/test').Page} page
 */
export async function addFirstItemToCart(page) {
  const addButton = page.locator('.inventory_item').first().locator('[data-test^="add-to-cart"]');
  await addButton.click();
  await expect(addButton).toHaveText(/Remove/);
}

/**
 * Opens the cart by clicking the shopping-cart icon.
 * @param {import('@playwright/test').Page} page
 */
export async function openCart(page) {
  await page.click('.shopping_cart_container');
  await expect(page).toHaveURL(/.*cart.html/);
}

/**
 * Returns the price of the first item in the cart.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
export async function getCartItemPrice(page) {
  return await page.locator('.cart_item .inventory_item_price').first().textContent();
}
