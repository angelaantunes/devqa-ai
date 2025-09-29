import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Gerar código Playwright ou sugestões a partir de prompt
export async function generateOpenAITestCode(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You generate clean Playwright test code." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  });

  return completion.choices[0].message.content.trim();
}

/**
 * Gera código Playwright e passos manuais para um caso
 */
export async function generateTestsForCase(testCase) {
 /* const prompt = `
You are an expert QA engineer. You are given a test case from GitHub issues.

Title: ${testCase.title}
Description: ${testCase.body || "No description provided"}

Tasks:
1. Generate Playwright (JavaScript) automated test code in ENGLISH that covers this scenario end-to-end.
2. Write clear manual test steps in ENGLISH that a human tester could follow.

Respond strictly in the following JSON format:
{
  "playwrightCode": "<Playwright test code here>",
  "manualSteps": ["Step 1...", "Step 2...", "..."]
}
`;*/

const prompt = `
You are an expert QA engineer. You are given a test case from GitHub issues.

Title: ${testCase.title}
Description: ${testCase.body || "No description provided"}

Tasks:
1) Identify reusable actions (e.g. openPage, fillInput, clickButton, login, getErrorMessage, verifyNavigation).
2) Generate helper functions for these actions in JavaScript. Put all helpers in 'utils.js'.
3) In the Playwright test file, import and use these helpers.
4) If no helpers are needed, return "utilsCode": "" (empty string).

Hard rules:
5) Use ES Modules syntax ONLY (import/export). NEVER use require().
6) In the test file, import utils with: import { ... } from '../utils/utils.js'
7) Every helper referenced in 'playwrightCode' MUST be fully implemented and exported in 'utilsCode' (no missing exports). Do not invent helpers that are not exported.

Selectors and defaults:
- fillInput(page, placeholder, value) must use: await page.getByPlaceholder(placeholder).fill(value)
- clickButton(page, text) must use: await page.getByRole('button', { name: text }).click()
- getErrorMessage(page) must return the visible text of the error element. Default selector:
  '[data-test="error"], .error-message-container, [role="alert"]' (first that exists).
- verifyNavigation(page, expectedUrl) must: await page.waitForURL(expectedUrl)
- openPage(page, url) must: await page.goto(url)
- login(page, username, password) must use fillInput + clickButton above.

Consistency Check (do this before responding):
- Parse the helper names imported from '../utils/utils.js' in 'playwrightCode'.
- Ensure that 'utilsCode' exports a function with exactly each of those names.
- If any helper is missing, add its full implementation to 'utilsCode' BEFORE returning the JSON.

Return strictly this JSON (no backticks, no extra fields):
{
  "utilsCode": "<complete utils.js code OR empty string>",
  "playwrightCode": "<complete Playwright test using the helpers and ESM imports>",
  "manualSteps": ["Step 1...", "Step 2...", "..."]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You generate Playwright tests with helper functions." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  });

  const responseText = completion.choices[0].message.content.trim();

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    console.error("Resposta não é JSON válido:", responseText);
    throw err;
  }

  return parsed;

}