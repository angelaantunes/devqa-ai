import { test, expect } from '@playwright/test';
import { postJson, assertCreatedUser } from '../utils/utils.js';

test('POST /api/users creates a user and returns 201 with expected payload', async ({ request }) => {
  const payload = { name: 'morpheus', job: 'leader' };
  const start = Date.now();

  const response = await postJson(request, 'https://reqres.in/api/users', payload);

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);

  expect(response.status()).toBe(201);
  const body = await response.json();

  assertCreatedUser(body, payload);
});