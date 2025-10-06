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
  // If a custom prompt is provided, use it; otherwise, use the default prompt
  const prompt = testCase.customPrompt
    ? testCase.customPrompt
    : `
You are an expert QA engineer. You are given a test case from GitHub issues.

Title: ${testCase.title}
Description: ${testCase.body || "No description provided"}

Tasks:
1) Identify reusable actions (e.g. openPage, fillInput, clickButton, login, getErrorMessage, verifyNavigation, sendApiRequest, verifyApiResponse).
2) Generate helper functions for these actions in JavaScript. Put all helpers in 'utils.js'.
3) In the Playwright test file, import and use these helpers.
4) If no helpers are needed, return "utilsCode": "" (empty string).

Hard rules:
5) Use ES Modules syntax ONLY (import/export). NEVER use require().
6) In the test file, import utils with: import { ... } from '../utils/utils.js'
7) Every helper referenced in 'playwrightCode' MUST be fully implemented and exported in 'utilsCode' (no missing exports).
8) For API tests, helpers must include sendApiRequest(page, method, url, payload) and verifyApiResponse(response, expectedFields).

Manual test case rules (important!):
- Manual steps MUST include example payloads and responses.
- Steps must validate each important response field individually (Status, Reason, TotalConfigurations, NewConfigurations, etc.).
- Include at least one happy path and one edge case (e.g. hash initialization delay).
- Each step should be explicit (not generic "verify response", but e.g. "Verify Reason = 'New webhook(s) configured...'").
- Always provide concrete data to test (e.g. webhook Name = "test1", URL = "http://localhost:3000/webhook").

Return strictly this JSON (no backticks, no extra fields):
{
  "utilsCode": "<complete utils.js code OR empty string>",
  "playwrightCode": "<complete Playwright test using the helpers and ESM imports>",
  "manualSteps": ["Step 1...", "Step 2...", "..."]
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
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