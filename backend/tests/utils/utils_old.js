// Exported helpers: openPage, clickButton, verifyAmount

export function openPage(page, url) {
  return page.goto(url);
}

export function clickButton(page, selector) {
  return page.click(selector);
}

export function verifyAmount(page, selector, expectedAmount) {
  return page.locator(selector).innerText().then(text => {
    if (text !== expectedAmount) {
      throw new Error(`Expected amount ${expectedAmount}, but got ${text}`);
    }
  });
}

// Exported helpers: openPage, login, verifyFirstItem

export function openPage(page, url) {
  return page.goto(url);
}

export async function login(page, username, password) {
  await page.fill('#user-name', username);
  await page.fill('#password', password);
  await page.click('#login-button');
}

export async function verifyFirstItem(page, expectedTitle, expectedPrice) {
  const firstItemTitle = await page.textContent('.inventory_item_name');
  const firstItemPrice = await page.textContent('.inventory_item_price');
  return firstItemTitle === expectedTitle && firstItemPrice === expectedPrice;
}

// Exported helpers: sendApiRequest, verifyApiResponse

export function sendApiRequest(page, method, url, payload) {
  return page.request[method.toLowerCase()](url, {
    data: payload,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function verifyApiResponse(response, expectedFields) {
  for (const [key, value] of Object.entries(expectedFields)) {
    if (key === 'NewConfigurations') {
      expect(response[key]).toHaveLength(value.length);
      for (let i = 0; i < value.length; i++) {
        expect(response[key][i]).toMatchObject(value[i]);
      }
    } else {
      expect(response[key]).toBe(value);
    }
  }
}

// Exported helpers: sendApiRequest, verifyApiResponse

export async function sendApiRequest(page, method, url, payload) {
  const response = await page.request[method.toLowerCase()](url, {
    data: payload,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response;
}

export async function verifyApiResponse(response, expectedFields) {
  const responseBody = await response.json();
  for (const [key, value] of Object.entries(expectedFields)) {
    if (key === 'createdAt') {
      if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/.test(responseBody[key])) {
        throw new Error(`Expected ${key} to be a valid ISO8601 timestamp, but got ${responseBody[key]}`);
      }
    } else if (key === 'id') {
      if (typeof responseBody[key] !== 'string' && typeof responseBody[key] !== 'number') {
        throw new Error(`Expected ${key} to be a string or number, but got ${typeof responseBody[key]}`);
      }
    } else if (responseBody[key] !== value) {
      throw new Error(`Expected ${key} to be ${value}, but got ${responseBody[key]}`);
    }
  }
  if (response.status() !== 201) {
    throw new Error(`Expected status 201, but got ${response.status()}`);
  }
}

// Exported helpers: openPage, fillInput, clickButton, getErrorMessage

export function openPage(page, url) {
  return page.goto(url);
}

export function fillInput(page, placeholder, value) {
  return page.fill(`input[placeholder="${placeholder}"]`, value);
}

export function clickButton(page, text) {
  return page.click(`button:has-text("${text}")`);
}

export function getErrorMessage(page) {
  return page.locator('.error-message-container').innerText();
}

// Exported helpers: openPage, fillInput, clickButton, verifyNavigation

export function openPage(page, url) {
  return page.goto(url);
}

export function fillInput(page, placeholder, value) {
  return page.fill(`input[placeholder="${placeholder}"]`, value);
}

export function clickButton(page, text) {
  return page.click(`text=${text}`);
}

export function verifyNavigation(page, expectedUrl) {
  return page.waitForURL(expectedUrl);
}