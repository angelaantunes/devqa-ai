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

export async function login(page) {
  await page.goto('https://www.saucedemo.com');
  await page.fill('[data-test="username"]', 'standard_user');
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await expect(page).toHaveURL(/inventory\.html/);
}

export async function addFirstItemToCart(page) {
  const firstItem = page.locator('.inventory_item').first();
  const price = await firstItem.locator('.inventory_item_price').textContent();
  await firstItem.locator('button:has-text("Add to cart")').click();
  await expect(firstItem.locator('button:has-text("Remove")')).toBeVisible();
  return price;
}

export async function openCart(page) {
  await page.click('.shopping_cart_container');
  await expect(page).toHaveURL(/cart\.html/);
}

export async function verifyCartItemPrice(page, expectedPrice) {
  const price = await page.locator('.cart_item .inventory_item_price').textContent();
  expect(price.trim()).toBe(expectedPrice);
}

export async function checkout(page) {
  await page.click('[data-test="checkout-button"]');
  await page.fill('[data-test="firstName"]', 'John');
  await page.fill('[data-test="lastName"]', 'Doe');
  await page.fill('[data-test="postalCode"]', '12345');
  await page.click('[data-test="continue"]');
  await expect(page).toHaveURL(/checkout-step-two\.html/);
}
