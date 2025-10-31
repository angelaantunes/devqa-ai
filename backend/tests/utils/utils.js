// Exported helpers: addFirstItemToCart, goToCart, getCartItemPrice, login, logout, getFirstItemTitle, getFirstItemPrice

export async function addFirstItemToCart(page) {
  const addButton = page.locator('.inventory_item').first().locator('button:has-text("Add to cart")');
  await addButton.click();
  await expect(addButton).toHaveText('Remove');
}

export async function goToCart(page) {
  await page.click('.shopping_cart_container');
  await expect(page).toHaveURL(/.*cart.html/);
}

export async function getCartItemPrice(page) {
  return page.locator('.cart_item .inventory_item_price').first().textContent();
}

export async function login(page, username, password) {
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
}

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
