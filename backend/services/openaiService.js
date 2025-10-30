import OpenAI from "openai"
import dotenv from "dotenv"
dotenv.config()

/*const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});*/

/*const openai = new OpenAI({
  apiKey: process.env.OPENROUTE_API_KEY,     // usar a chave do OpenRouter
  baseURL: process.env.OPENAI_BASE_URL       // usar a base URL do OpenRouter
});*/

const openai = new OpenAI({
  baseURL: process.env.HF_BASE_URL,
  apiKey: process.env.HF_TOKEN,
})

// Gerar código Playwright ou sugestões a partir de prompt
export async function generateOpenAITestCode(prompt) {
  const completion = await openai.chat.completions.create({
    //model: "gpt-4o",
    model: "moonshotai/Kimi-K2-Instruct-0905",
    messages: [
      { role: "system", content: "You generate clean Playwright test code." },
      { role: "user", content: prompt },
    ],
    temperature: 0,
  })

  return completion.choices[0].message.content.trim()
}

/**
 * Gera código Playwright e passos manuais para um caso
 */
export async function generateTestsForCase(testCase) {
  const prompt = testCase.customPrompt
    ? testCase.customPrompt
    : `
You are an expert QA engineer. You are given a test case from GitHub issues.

Title: ${testCase.title}
Description: ${testCase.body || "No description provided"}

Your goal:
Generate a Playwright test file and a helper utilities file that follow **strict ES Modules syntax** (no CommonJS, no require, no module.exports).

Tasks:
1) Identify reusable actions (e.g. openPage, fillInput, clickButton, login, getErrorMessage, verifyNavigation, sendApiRequest, verifyApiResponse) needed for the test.
2) For every action used in 'playwrightCode', generate a corresponding helper function in JavaScript and export it **by name** using 'export function' in 'utils.js'. Add all helpers for this test here. 
3) In the Playwright test file, import and use only the helpers that are **actually exported** from 'utils.js'.
4) If no helpers are needed, return "utilsCode": "" (empty string), and ensure the test file does not try to import any helpers.
5) **At the start of utils.js, add a comment section listing the names of all exported helper functions for this test.** Example:
   // Exported helpers: sendApiRequest, getErrorMessage

Hard rules:
- Use ES Modules syntax ONLY (import/export). NEVER use require().
- Each function imported in the test file MUST exist and be exported by name in utils.js — no missing or extra helpers.
- For API tests, sendApiRequest(page, method, url, payload) and verifyApiResponse(response, expectedFields) must follow these rules and be fully implemented and exported.
- Do NOT use default exports. Do NOT use require().
- If helpers are unused, ensure their export is removed from utils.js.

Helper implementation rules (critical!):
* Every helper function imported in 'playwrightCode' MUST be implemented and exported by name in utils.js with: export function <name>(...) { ... }
* DO NOT use default exports anywhere.
* DO NOT reference any helpers that are missing or not implemented.
* If no helpers are needed, 'utilsCode' must be an empty string and NO import should be in 'playwrightCode'.
* Check that helpers like sendApiRequest and getErrorMessage are exported if imported.

Validation step (critical!):
- After generating the test and the utils.js file, check that every helper in the test import appears with 'export function NAME' in utils.js. If any import is missing, add its implementation; if any export is not imported, remove it.

🧩 Manual steps:
- Always return manualSteps as a **list of strings**, NOT objects.
- Each step should start with a number and a period (e.g., "1. Open the browser...").
- DO NOT use { step, action } or any JSON objects. Just an array of strings.

Return strictly this JSON (no backticks, no extra fields):
{
  "utilsCode": "<complete utils.js code OR empty string>",
  "playwrightCode": "<complete Playwright test using the helpers and ESM imports>",
  "manualSteps": ["1. Step one...", "2. Step two...", "..."]
}

Example:
playwrightCode:
import { test, expect } from '@playwright/test';
import { login, openPage } from '../utils/utils.js';

test('Login works correctly', async ({ page }) => {
  await openPage(page, '/login');
  await login(page, 'user', 'pass');
  await expect(page).toHaveURL('/dashboard');
});

utilsCode:
export async function openPage(page, url) {
  await page.goto(url);
}

export async function login(page, username, password) {
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
}
`

  const completion = await openai.chat.completions.create({
    model: "moonshotai/Kimi-K2-Instruct-0905",
    messages: [
      { role: "system", content: "You generate Playwright tests with helper functions." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  })

  const responseContent = completion.choices?.[0]?.message?.content

  if (!responseContent) {
    throw new Error("Resposta vazia do OpenAI")
  }

  // responseContent já é um objeto JSON conforme response_format json_object
  return responseContent
}
