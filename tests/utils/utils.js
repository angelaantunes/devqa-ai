export async function login(page, username, password) {
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

export async function addFirstItemToCart(page) {
  const addButton = page.locator('[data-test="inventory-item"] >> [data-test^="add-to-cart"]').first();
  await addButton.click();
  await expect(addButton).toHaveText('Remove');
}

export async function goToCart(page) {
  await page.click('[data-test="shopping-cart-container"]');
  await expect(page).toHaveURL(/.*cart.html/);
}

export async function getCartItemPrice(page, index = 0) {
  return page
    .locator('[data-test="cart-item"] >> [data-test="inventory-item-price"]')
    .nth(index)
    .textContent();
}
