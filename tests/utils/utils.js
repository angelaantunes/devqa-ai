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

/**
 * Adds the first inventory item whose price matches the expected value.
 * @param {import('@playwright/test').Page} page
 * @param {string} expectedPrice - Price to match (e.g., '29.99')
 */
export async function addFirstItemToCart(page, expectedPrice) {
  const priceLocator = page.locator('.inventory_item').first().locator('.inventory_item_price');
  const priceText = await priceLocator.textContent();
  const price = priceText.replace(/[^0-9.]/g, '');
  if (price !== expectedPrice) {
    throw new Error(`First item price is $${price}, expected $${expectedPrice}`);
  }
  const addButton = page.locator('.inventory_item').first().locator('[data-test="add-to-cart-sauce-labs-backpack"]');
  await addButton.click();
  await expect(addButton).toHaveText('Remove');
}

/**
 * Clicks the shopping-cart icon to navigate to the cart page.
 * @param {import('@playwright/test').Page} page
 */
export async function goToCart(page) {
  await page.click('#shopping_cart_container');
  await expect(page).toHaveURL(/.*cart.html/);
}

/**
 * Returns the displayed price of the nth item in the cart.
 * @param {import('@playwright/test').Page} page
 * @param {number} index - 1-based index
 * @returns {Promise<string>}
 */
export async function getCartItemPrice(page, index) {
  const priceLocator = page.locator('.cart_item').nth(index - 1).locator('.inventory_item_price');
  return (await priceLocator.textContent()).trim();
}
