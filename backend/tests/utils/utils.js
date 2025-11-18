// Exported helpers: logout, getFirstItemTitle, getFirstItemPrice, addFirstItemToCart, goToCart, getCartItemPrice, loginWithCredentials, getErrorMessage, clearFields, assertLoginError, waitForURL, login

export async function logout(page) {
  await page.click('#react-burger-menu-btn');
  await page.click('[data-test="logout-sidebar-link"]');
}

export async function getFirstItemTitle(page) {
  return await page.locator('.inventory_item').first().locator('.inventory_item_name').innerText();
}

export async function getFirstItemPrice(page) {
  return await page.locator('.inventory_item').first().locator('.inventory_item_price').innerText();
}

export async function addFirstItemToCart(page) {
  const addButton = page.locator('[data-test^="add-to-cart"]').first();
  await addButton.waitFor({ state: 'visible' });
  await addButton.click();
  // Optional: wait for state change to Remove
  await expect(page.locator('[data-test^="remove-"]')).toBeVisible();
}

export async function goToCart(page) {
  await page.click('[data-test="shopping-cart-container"]');
  await page.waitForURL('**/cart.html');
}

export async function getCartItemPrice(page) {
  // Assumes single item in cart; adjust selector if needed
  return await page.locator('.inventory_item_price').first().textContent();
}

export async function loginWithCredentials(page, username, password) {
  await page.fill('input[placeholder="Username"]', username);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('input[type="submit"]');
}

export async function getErrorMessage(page) {
  return await page.textContent('[data-test="error"]');
}

export async function clearFields(page) {
  await page.fill('[data-test="username"]', '');
  await page.fill('[data-test="password"]', '');
}

export async function assertLoginError(page, text) {
  const error = page.locator('[data-test="error"]');
  await expect(error).toBeVisible();
  await expect(error).toContainText(text);
  // ensure we stay on login page
  await expect(page).toHaveURL(/.*saucedemo\.com\/$/);
}

export async function waitForURL(page, url, timeout = 10000) {
  await page.waitForURL(url, { timeout });
}

export async function login(page, username, password) {
  await page.fill('input[placeholder="Username"]', username);
  await page.fill('input[placeholder="Password"]', password);
  await page.click('input[type="submit"][value="Login"]');
}
