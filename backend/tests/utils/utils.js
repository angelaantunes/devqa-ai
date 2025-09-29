export async function openPage(page, url) {
    await page.goto(url);
}

export async function fillInput(page, placeholder, value) {
    await page.getByPlaceholder(placeholder).fill(value);
}

export async function clickButton(page, text) {
    await page.getByRole('button', { name: text }).click();
}

export async function verifyNavigation(page, expectedUrl) {
    await page.waitForURL(expectedUrl);
}

export async function login(page, username, password) {
    await fillInput(page, 'Username', username);
    await fillInput(page, 'Password', password);
    await clickButton(page, 'Login');
}

export async function getErrorMessage(page) {
    const errorElement = await page.$('[data-test="error"], .error-message-container, [role="alert"]');
    return errorElement ? errorElement.innerText() : '';
}