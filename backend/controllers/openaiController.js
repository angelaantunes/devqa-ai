import { getTestCases } from "../services/testCaseStore.js"
import { generateTestsForCase } from "../services/openaiService.js"
import fs from "fs"
import path from "path"
import { saveGeneratedTestsAsFiles } from "../services/saveTestsService.js";

export async function generateTestsFromCases(req, res) {
  try {
    const testCases = getTestCases()
    if (!testCases.length) {
      return res.status(400).json({ error: "No test cases stored. Call /api/test-cases first." })
    }

    const results = []
    for (const testCase of testCases) {
      const aiResult = await generateTestsForCase(testCase)
      results.push({
        title: testCase.title,
        url: testCase.url,
        utilsCode: aiResult.utilsCode || "",
        playwrightCode: aiResult.playwrightCode,
        manualSteps: aiResult.manualSteps,
      })
    }

    const filePath = path.join(process.cwd(), "", "generated_tests.json")
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), "utf-8")

    console.log(`✅ Testes gerados e guardados em ${filePath}`)

    res.json(results)
  } catch (error) {
    console.error("Error generating tests from cases:", error)
    res.status(500).json({ error: "Failed to generate tests" })
  }
}

export function saveGeneratedTestsController(req, res) {
  try {
    const result = saveGeneratedTestsAsFiles();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
