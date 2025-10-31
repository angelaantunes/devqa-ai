// Exported helpers: addFirstItemToCart, goToCart, getCartItemPrice, getFirstItemTitle, getFirstItemPrice, logout, getFirstInventoryItem, login

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

export async function getFirstItemTitle(page) {
  return await page.locator('.inventory_item').first().locator('.inventory_item_name').innerText();
}

export async function getFirstItemPrice(page) {
  return await page.locator('.inventory_item').first().locator('.inventory_item_price').innerText();
}

export async function logout(page) {
  await page.click('#react-burger-menu-btn');
  await page.click('[data-test="logout-sidebar-link"]');
  await page.waitForURL(/.*\/$/);
}

export async function getFirstInventoryItem(page) {
  const item = page.locator('.inventory_item').first();
  const title = await item.locator('.inventory_item_name').textContent();
  const price = await item.locator('.inventory_item_price').textContent();
  return { title: title.trim(), price: price.trim() };
}

export async function login(page, username, password) {
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}
