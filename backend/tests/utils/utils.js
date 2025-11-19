// Exported helpers: logout, getFirstItemTitle, getFirstItemPrice, goToCart, getCartItemPrice, loginWithCredentials, getErrorMessage, login, addFirstItemToCart, openCart, getCartBadge, getItemPrice, removeCartFromLocalStorage

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
  const errorLocator = page.locator('[data-test="error"]');
  await errorLocator.waitFor({ state: 'visible' });
  return errorLocator.textContent();
}

export async function login(page, username, password) {
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
}

export async function addFirstItemToCart(page) {
  const btn = page.locator('[data-test^="add-to-cart"]').first();
  await btn.waitFor({ state: 'visible' });
  await btn.click();
}

export async function openCart(page) {
  await page.click('[data-test="shopping-cart-container"]');
  await page.waitForURL('**/cart.html');
}

export async function getCartBadge(page) {
  const badge = page.locator('.shopping_cart_badge');
  if (!(await badge.isVisible())) return 0;
  return parseInt(await badge.textContent(), 10);
}

export async function getItemPrice(page) {
  return page.locator('.inventory_item_price').first().textContent();
}

export async function removeCartFromLocalStorage(page) {
  await page.evaluate(() => localStorage.removeItem('cart-contents'));
}
