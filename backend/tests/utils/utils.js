// Exported helpers: logout, getFirstItemTitle, getFirstItemPrice, addFirstItemToCart, goToCart, getCartItemPrice, loginWithCredentials, clearFields, assertLoginError, waitForURL, checkLoginError, getErrorMessage, waitForUrl, checkErrorMessage, resetPage, login, clearInput, waitForError

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

export async function checkLoginError(page, expectedText) {
  const error = page.locator('[data-test="error"]');
  await expect(error).toBeVisible();
  await expect(error).toContainText(expectedText);
}

export async function getErrorMessage(page) {
  return await page.textContent('[data-test="error"]');
}

export async function waitForUrl(page, url, timeout = 5000) {
  await page.waitForURL(url, { timeout });
}

export async function checkErrorMessage(page, expectedText) {
  const errorLocator = page.locator('[data-test="error"]');
  await expect(errorLocator).toBeVisible();
  await expect(errorLocator).toContainText(expectedText);
}

export async function resetPage(page) {
  await page.reload();
}

export async function login(page, username, password) {
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
}

export async function clearInput(page, selector) {
  await page.click(selector, { clickCount: 3 });
  await page.press(selector, 'Backspace');
}

export async function waitForError(page) {
  await page.waitForSelector('[data-test="error"]', { state: 'visible' });
}
