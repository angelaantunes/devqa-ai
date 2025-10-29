import fs from "fs"
import path from "path"
import { fileURLToPath } from "url";
import { uploadAllGeneratedTestsToGitHub, uploadTestFileToGitHub } from "./githubFileService.js"

export async function saveGeneratedTestsAsFiles() {
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
  data.forEach((tc) => {
    if (tc.utilsCode && tc.utilsCode.trim()) {
      if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true })
      const utilsPath = path.join(utilsDir, "utils.js")
      fs.writeFileSync(utilsPath, tc.utilsCode, "utf-8")
      utilsSaved = true
    }
  })

  // 2. Salvar cada teste Playwright
  data.forEach((tc) => {
    const filename = tc.title
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
    const filePath = path.join(testsDir, `${filename}.spec.js`)
    fs.writeFileSync(filePath, tc.playwrightCode, "utf-8")
  })

  // 3. Salvar manualSteps (opcional)
  data.forEach((tc) => {
    if (tc.manualSteps && tc.manualSteps.length) {
      const filename = tc.title
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
      const stepsPath = path.join(testsDir, `${filename}_manual_steps.json`)
      fs.writeFileSync(stepsPath, JSON.stringify(tc.manualSteps, null, 2), "utf-8")
    }
  })
  console.log("📤 Uploading generated files to GitHub...")
  const results = await uploadAllGeneratedTestsToGitHub()
  console.log(
    "✅ Upload completo:",
    results.map((r) => r.url || r.error),
  )
  return { message: "Test files saved successfully", count: data.length, uploaded: results }
}

export async function saveTestFilesForSingleCase(id) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  // Determinar raiz do backend, assumindo que este ficheiro está em backend/src ou backend/services
  const backendRoot = path.resolve(__dirname, "..") // Ajusta ".." se o teu ficheiro estiver mais fundo

  // Usa backendRoot em vez de process.cwd()
  const utilsDir = path.join(backendRoot, "tests", "utils")
  const testsDir = path.join(backendRoot, "tests", "generated")

  // A partir daqui usa esses paths para guardar os ficheiros

  //const jsonPath = path.join(process.cwd(), "generated_tests.json")
  const jsonPath = path.join(backendRoot, "generated_tests.json");

  if (!fs.existsSync(jsonPath)) throw new Error("Nenhum ficheiro generated_tests.json encontrado.")

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))

  // 🧭 Encontrar o caso certo pelo número do issue
  const tc = data.find((item) => {
    const issueNumber = item.url?.match(/\/issues\/(\d+)$/)?.[1]
    return issueNumber === String(id)
  })

  if (!tc) throw new Error(`Test case não encontrado para o número ${id} no ficheiro generated_tests.json.`)

  // ✨ Código gerado pelo GPT
  const utilsCode = tc.utilsCode?.trim() || ""
  let playwrightCode = tc.playwrightCode?.trim() || ""

  // 🔧 Corrige import do utils no Playwright code
  playwrightCode = playwrightCode.replace(/from\s+['"].\/utils[^'"]*['"]/, "from '../utils/utils.js'")

  // 🗂️ Diretórios de destino
  //const utilsDir = path.join(process.cwd(), "tests", "utils")
  //const testsDir = path.join(process.cwd(), "tests", "generated")
  if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true })
  if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true })

  // 📘 Guardar utils (sem duplicações)
  const utilsPath = path.join(utilsDir, "utils.js")
  let existingUtils = ""
  if (fs.existsSync(utilsPath)) {
    existingUtils = fs.readFileSync(utilsPath, "utf-8")
  }

  // Detectar funções novas e não duplicar
  const newFunctions = [...utilsCode.matchAll(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g)].map((m) => m[1])
  const missingFunctions = newFunctions.filter((fn) => !existingUtils.includes(`function ${fn}(`))

  if (missingFunctions.length > 0) {
    const mergedUtils = existingUtils ? `${existingUtils.trim()}\n\n${utilsCode}` : utilsCode
    fs.writeFileSync(utilsPath, mergedUtils.trim() + "\n", "utf-8")
  }

  // 🧪 Guardar ficheiro de teste Playwright
  const filename = tc.title
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")

  const filePath = path.join(testsDir, `${filename}.spec.js`)
  fs.writeFileSync(filePath, playwrightCode, "utf-8")

  // 🪶 Guardar passos manuais (se existirem)
  if (tc.manualSteps && tc.manualSteps.length) {
    const stepsPath = path.join(testsDir, `${filename}_manual_steps.json`)
    fs.writeFileSync(stepsPath, JSON.stringify(tc.manualSteps, null, 2), "utf-8")
  }

  // 📤 Enviar o ficheiro e utils para o GitHub
  console.log(`📤 A enviar ficheiros do teste #${id} (${filename}.spec.js) para o GitHub...`)
  const repoPathTest = `backend/tests/generated/${filename}.spec.js`
  const repoPathUtils = `backend/tests/utils/utils.js`

  try {
    const testUpload = await uploadTestFileToGitHub(filePath, repoPathTest, `Add/Update test for issue #${id}: ${tc.title}`)
    const utilsUpload = await uploadTestFileToGitHub(utilsPath, repoPathUtils, `Update utils.js for test #${id}`)

    console.log("✅ Upload concluído:", {
      test: testUpload.content.html_url,
      utils: utilsUpload.content.html_url,
    })

    // ✅ Agora devolve também o filename — essencial para o frontend e run remoto
    return {
      message: `✅ Test files for ticket #${id} saved and uploaded successfully`,
      title: tc.title,
      filename: `${filename}.spec.js`, // ← devolve o nome exato
      uploaded: {
        test: testUpload.content.html_url,
        utils: utilsUpload.content.html_url,
      },
    }
  } catch (err) {
    console.error("❌ Erro ao enviar para o GitHub:", err.message)
    return {
      message: `⚠️ Test saved locally but failed to upload to GitHub.`,
      title: tc.title,
      filename: `${filename}.spec.js`, // mesmo em erro devolve o nome
      error: err.message,
    }
  }
}
