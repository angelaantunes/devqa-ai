import { test, expect } from '@playwright/test';
import { postWebhookSettings, getWebhookSettings } from '../utils/utils.js';

test.describe('POST /webhook/settings/ - insert only behavior', () => {
  let initialCount;
  let authToken;

  test.beforeAll(async ({ request }) => {
    // Login and store token
    const login = await request.post('/auth/login', {
      data: { username: 'testuser', password: 'testpass' }
    });
    expect(login.ok()).toBeTruthy();
    const body = await login.json();
    authToken = body.token;

    // Capture initial state
    const initial = await getWebhookSettings(request, authToken);
    initialCount = initial.length;
  });

  test('POST adds new webhook without deleting existing ones', async ({ request }) => {
    const payload = [{
      Name: 'test1',
      Url: 'http://localhost:3000/webhook',
      Triggers: { POSubmit: { Enabled: true, Filter: 'ApprovalCode = A' } }
    }];

    const response = await postWebhookSettings(request, authToken, payload);
    expect(response.status).toBe('success');
    expect(response.Reason).toContain('New webhook(s) configured');
    expect(response.TotalConfigurations).toBe(initialCount + 1);
    expect(response.NewConfigurations).toHaveLength(1);
    expect(response.NewConfigurations[0].Name).toBe('test1');

    // Verify no deletions occurred
    const current = await getWebhookSettings(request, authToken);
    expect(current.length).toBe(initialCount + 1);
  });

  test('POST multiple webhooks in one call', async ({ request }) => {
    const payload = [
      { Name: 'multi1', Url: 'http://localhost:3001/webhook', Triggers: { TOSubmit: { Enabled: true } } },
      { Name: 'multi2', Url: 'http://localhost:3002/webhook', Triggers: { WOSubmit: { Enabled: true } } }
    ];

    const response = await postWebhookSettings(request, authToken, payload);
    expect(response.status).toBe('success');
    expect(response.TotalConfigurations).toBe(initialCount + 3); // previous + 2 new
    expect(response.NewConfigurations).toHaveLength(2);
  });

  test('POST with empty array returns 400', async ({ request }) => {
    const res = await request.post('/webhook/settings/', {
      headers: { Authorization: `Bearer ${authToken}` },
      data: []
    });
    expect(res.status()).toBe(400);
  });

  test('POST without auth returns 401', async ({ request }) => {
    const res = await request.post('/webhook/settings/', {
      data: [{ Name: 'unauth', Url: 'http://localhost:3003/webhook' }]
    });
    expect(res.status()).toBe(401);
  });
});