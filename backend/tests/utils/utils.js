export async function login(page) {
  await page.goto('https://www.saucedemo.com');
  await page.fill('[data-test="username"]', 'standard_user');
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await expect(page).toHaveURL(/inventory\.html/);
}

export async function postJson(request, url, data) {
  return request.post(url, {
    headers: { 'Content-Type': 'application/json' }

export function assertCreatedUser(body, expected) {
  const { name, job }

export async function logout(page) {
  await page.click('#react-burger-menu-btn');
  await page.click('[data-test="logout-sidebar-link"]');
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

export async function addFirstItemToCart(page) {
  const addButton = page.locator('.inventory_item').first().locator('button:has-text("Add to cart")');
  await addButton.click();
  await expect(addButton).toHaveText('Remove');
}

export async function goToCart(page) {
  await page.click('.shopping_cart_container');
  await expect(page).toHaveURL(/.*cart.html/);
}

export async function getCartItemCount(page) {
  return page.locator('.cart_item').count();
}

export async function getCartItemPrice(page, index = 0) {
  return page.locator('.cart_item').nth(index).locator('.inventory_item_price').textContent();
}
