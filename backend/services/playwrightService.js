import { chromium } from "playwright";

const testResults = []; // Guarda resultados simples em memória temporária

export async function executePlaywrightTest(testCase) {
  // Exemplo bem simples: se tiver url, navega e checa título
  if (!testCase.url) {
    return { success: false, error: "URL ausente no caso de teste" };
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(testCase.url);
    const title = await page.title();

    // Guarda resultado com timestamp
    testResults.push({
      testCase: testCase.title,
      url: testCase.url,
      success: true,
      title,
      timestamp: new Date(),
    });

    return { success: true, title };
  } catch (error) {
    testResults.push({
      testCase: testCase.title,
      url: testCase.url,
      success: false,
      error: error.message,
      timestamp: new Date(),
    });
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

export function getAllTestResults() {
  return testResults;
}
