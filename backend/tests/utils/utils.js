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

export async function login(page, username, password) {
  await page.fill('[data-test="username"]', username);
  await page.fill('[data-test="password"]', password);
  await page.click('[data-test="login-button"]');
}

export async function logout(page) {
  await page.click('#react-burger-menu-btn');
  await page.click('[data-test="logout-sidebar-link"]');
}
