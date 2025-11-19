import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();


/*const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});*/

/*const openai = new OpenAI({
  apiKey: process.env.OPENROUTE_API_KEY,     // usar a chave do OpenRouter
  baseURL: process.env.OPENAI_BASE_URL       // usar a base URL do OpenRouter
});*/

const openai = new OpenAI({
    baseURL:process.env.HF_BASE_URL,
    apiKey:process.env.HF_TOKEN,
})


// Gerar código Playwright ou sugestões a partir de prompt
export async function generateOpenAITestCode(prompt) {
  const completion = await openai.chat.completions.create({
    //model: "gpt-4o",
    model:"moonshotai/Kimi-K2-Instruct-0905",
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
`;

  // Add some diagnostics and retry logic because HF endpoints sometimes return HTML 500 pages
  const modelName = "moonshotai/Kimi-K2-Instruct-0905";
  const maxAttempts = 3;
  let completion;
  let lastError = null;

  // small helper
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log(`🧠 Requesting model=${modelName} prompt_length=${String(prompt).length}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const includeResponseFormat = attempt === 1; // try structured response only on first attempt
    try {
      const req = {
        model: modelName,
        messages: [
          { role: "system", content: "You generate Playwright tests with helper functions." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
      };
      if (includeResponseFormat) req.response_format = { type: "json_object" };

      completion = await openai.chat.completions.create(req);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      // Log key diagnostics
      console.error(`OpenAI/HF completion error (attempt ${attempt}/${maxAttempts}):`, err?.status || err?.message || err);
      if (err?.headers) console.error("Response headers:", err.headers);
      if (err?.requestID) console.error("Request ID:", err.requestID);
      // If this was the last attempt, we'll rethrow below
      if (attempt < maxAttempts) {
        const backoff = 500 * Math.pow(2, attempt - 1);
        console.warn(`Retrying after ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
    }
  }

  if (lastError && !completion) {
    // Try to enrich the error message if HF returned HTML
    const headers = lastError?.headers;
    const requestID = lastError?.requestID || headers?.['x-request-id'] || headers?.['x-amz-cf-id'];
    const status = lastError?.status || headers?.status || 500;
    const errMsg = `Model request failed after ${maxAttempts} attempts. status=${status} requestID=${requestID}`;
    const e = new Error(errMsg);
    e.cause = lastError;
    throw e;
  }

  let responseText = completion.choices?.[0]?.message?.content || "";

  // cleanup markdown blocks if present
  responseText = responseText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

  // extract first {...} JSON object
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) responseText = jsonMatch[0];

  // try parse; if fails, attempt a simple repair of unescaped quotes in code strings
  try {
    const parsed = JSON.parse(responseText);
    return ensureDescribeWrapper(parsed, testCase);
  } catch (err1) {
    // attempt to escape inner double-quotes inside code blocks between quotes
    try {
      // Heuristic: replace occurrences of "code with "inner "quotes" inside by escaping interior quotes
      // We only attempt a mild repair — not bulletproof, but reduces common failures.
      let repaired = responseText
        // remove trailing non-json after the object if any
        .replace(/}\s*[^}]*$/s, "}")
        // escape any double quotes that appear between parentheses or after = in code (very heuristic)
        .replace(/(["])([^\n]*?)(["])(?=[\s\S]*?:)/g, (m) => m); // noop safe fallback

      // Final fallback: attempt to parse with Function constructor (risky) — avoid. Instead rethrow original.
      throw err1;
    } catch (err2) {
      console.error("Resposta não é JSON válido:", responseText);
      throw err1;
    }
  }
}

// Ensure Playwright code uses test.describe wrapper
function ensureDescribeWrapper(parsed, testCase) {
  if (!parsed || typeof parsed.playwrightCode !== 'string') return parsed;
  const code = parsed.playwrightCode;
  // If already contains test.describe, return as-is
  if (/\btest\.describe\s*\(/.test(code)) return parsed;

  // Find the first test('...') occurrence and wrap all tests into a describe block
  const lines = code.split(/\r?\n/);
  const firstTestIndex = lines.findIndex(l => /\btest\s*\(/.test(l));
  if (firstTestIndex === -1) return parsed;

  const importsAndHeader = lines.slice(0, firstTestIndex).join('\n');
  const testsBody = lines.slice(firstTestIndex).join('\n');

  const m = testsBody.match(/test\s*\(\s*['"`]([^'"`]+)['"`]/);
  const describeTitle = m ? m[1] : (testCase && testCase.title ? testCase.title : 'Generated tests');

  const wrapped = `${importsAndHeader}\n\ntest.describe(${JSON.stringify(describeTitle)}, () => {\n${testsBody.split('\n').map(l=> '  '+l).join('\n')}\n});`;

  return { ...parsed, playwrightCode: wrapped };
}