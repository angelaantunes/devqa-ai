import fs from "fs"
import path from "path"

export function saveGeneratedTestsAsFiles() {
  // Lê o JSON que foi gerado anteriormente
  const jsonPath = path.join(process.cwd(), "", "generated_tests.json")
  if (!fs.existsSync(jsonPath)) {
    throw new Error("Nenhum ficheiro generated_tests.json encontrado — gera primeiro os testes.")
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))

  const testsDir = path.join(process.cwd(), "", "tests", "generated")
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true })
  }

  data.forEach((tc) => {
    const filename = tc.title
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")

    let code = tc.playwrightCode.replace(/^const\s*\{\s*test,\s*expect\s*\}\s*=\s*require\(['"]@playwright\/test['"]\);?/m, "import { test, expect } from '@playwright/test';")

    const filePath = path.join(testsDir, `${filename}.spec.js`)
    fs.writeFileSync(filePath, code, "utf-8")
    console.log(`📝 Test file created: ${filePath}`)
  })

  return { message: "Test files saved successfully", count: data.length }
}
