// Exported helpers: getFirstItemTitle, getFirstItemPrice, goToCart, loginWithCredentials, getErrorMessage, logout, login, getLoginErrorMessage, clearLoginFields, addFirstItemToCart, openCart, waitForCartLoaded, getCartBadgeCount, getCartItemPrice, interceptCart500, goOffline, goOnline, deleteCartStorage

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

export async function logout(page) {
  await page.click('#react-burger-menu-btn');
  await page.click('[data-test="logout-sidebar-link"]');
  await expect(page).toHaveURL('https://www.saucedemo.com/');
}

export async function login(page, username, password) {
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
}

export async function getLoginErrorMessage(page) {
  return await page.textContent('[data-test="error"]');
}

export async function clearLoginFields(page) {
  await page.fill('[data-test="username"]', '');
  await page.fill('[data-test="password"]', '');
}

export async function addFirstItemToCart(page) {
  const btn = page.locator('.inventory_item').first().locator('button:has-text("Add to cart")');
  await btn.click();
  await expect(page.locator('.shopping_cart_badge')).toHaveText('1');
}

export async function openCart(page) {
  await page.click('.shopping_cart_container');
  await expect(page).toHaveURL(/.*cart/i);
}

export async function waitForCartLoaded(page) {
  await expect(page.locator('.cart_item')).toBeVisible();
}

export async function getCartBadgeCount(page) {
  const badge = page.locator('.shopping_cart_badge');
  if (!(await badge.isVisible())) return 0;
  return parseInt(await badge.textContent(), 10);
}

export async function getCartItemPrice(page) {
  return page.locator('.cart_item .inventory_item_price').first().textContent();
}

export async function interceptCart500(page) {
  await page.route('**/cart', route => route.abort('failed'));
}

export async function goOffline(page) {
  await page.context().setOffline(true);
}

export async function goOnline(page) {
  await page.context().setOffline(false);
}

export async function deleteCartStorage(page) {
  await page.evaluate(() => {
    localStorage.removeItem('cart-contents');
    sessionStorage.removeItem('cart-contents');
  });
}
