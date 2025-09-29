  import fs from "fs"
  import path from "path"

  export function saveGeneratedTestsAsFiles() {
    const jsonPath = path.join(process.cwd(), "generated_tests.json")
    if (!fs.existsSync(jsonPath)) {
      throw new Error("Nenhum ficheiro generated_tests.json encontrado — gera primeiro os testes.")
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
    const testsDir = path.join(process.cwd(), "tests", "generated")
    if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true })

    // 1. Salvar utils.js se existir utilsCode
    const utilsDir = path.join(process.cwd(), "tests", "utils")
    let utilsSaved = false
    data.forEach(tc => {
      if (tc.utilsCode && tc.utilsCode.trim()) {
        if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true })
        const utilsPath = path.join(utilsDir, "utils.js")
        fs.writeFileSync(utilsPath, tc.utilsCode, "utf-8")
        utilsSaved = true
      }
    })

    // 2. Salvar cada teste Playwright
    data.forEach(tc => {
      const filename = tc.title
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
      const filePath = path.join(testsDir, `${filename}.spec.js`)
      fs.writeFileSync(filePath, tc.playwrightCode, "utf-8")
    })

    // 3. Salvar manualSteps (opcional)
    data.forEach(tc => {
      if (tc.manualSteps && tc.manualSteps.length) {
        const filename = tc.title
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")
        const stepsPath = path.join(testsDir, `${filename}_manual_steps.json`)
        fs.writeFileSync(stepsPath, JSON.stringify(tc.manualSteps, null, 2), "utf-8")
      }
    })

    return { message: "Test files saved successfully", count: data.length }
  }
