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
  if (!body || typeof body !== 'object') {
    throw new Error('Response body is not an object');
  }
  const { name, job, id, createdAt } = body;
  if (name !== expected.name) throw new Error(`Expected name=${expected.name}, got ${name}`);
  if (job !== expected.job) throw new Error(`Expected job=${expected.job}, got ${job}`);
  if (!id && id !== 0) throw new Error('Missing id in response');
  if (!createdAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(createdAt)) {
    throw new Error('createdAt is not a valid ISO8601 timestamp');
  }
}
