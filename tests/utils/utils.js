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

export async function getWebhookSettings(request, token) {
  const res = await request.get('/webhook/settings/', {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.ok()).toBeTruthy();
  return await res.json();
}

export async function postWebhookSettings(request, token, payload) {
  const res = await request.post('/webhook/settings/', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    data: payload
  });
  expect(res.ok()).toBeTruthy();
  return await res.json();
}
