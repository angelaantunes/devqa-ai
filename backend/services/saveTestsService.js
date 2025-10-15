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

  return { message: "Test files saved successfully", count: data.length }
}

export function saveTestFilesForSingleCase(id) {
  const jsonPath = path.join(process.cwd(), "generated_tests.json");
  if (!fs.existsSync(jsonPath))
    throw new Error("Nenhum ficheiro generated_tests.json encontrado.");

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // 🧭 Encontrar o caso certo pelo número do issue
  const tc = data.find((item) => {
    const issueNumber = item.url?.match(/\/issues\/(\d+)$/)?.[1];
    return issueNumber === String(id);
  });

  if (!tc)
    throw new Error(`Test case não encontrado para o número ${id} no ficheiro generated_tests.json.`);

  // ✨ Código gerado pelo GPT
  const utilsCode = tc.utilsCode?.trim() || "";
  let playwrightCode = tc.playwrightCode?.trim() || "";

  // 🔧 Corrige import do utils no Playwright code
  playwrightCode = playwrightCode.replace(
    /from\s+['"].\/utils[^'"]*['"]/,
    "from '../utils/utils.js'"
  );

  // 🗂️ Diretórios de destino
  const utilsDir = path.join(process.cwd(), "tests", "utils");
  const testsDir = path.join(process.cwd(), "tests", "generated");
  if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });
  if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });

  // 📘 Guardar utils (sem duplicações)
  const utilsPath = path.join(utilsDir, "utils.js");
  let existingUtils = "";
  if (fs.existsSync(utilsPath)) {
    existingUtils = fs.readFileSync(utilsPath, "utf-8");
  }

  // Detectar funções novas e não duplicar
  const newFunctions = [...utilsCode.matchAll(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g)].map(m => m[1]);
  const missingFunctions = newFunctions.filter(fn => !existingUtils.includes(`function ${fn}(`));

  if (missingFunctions.length > 0) {
    const mergedUtils = existingUtils
      ? `${existingUtils.trim()}\n\n${utilsCode}`
      : utilsCode;
    fs.writeFileSync(utilsPath, mergedUtils.trim() + "\n", "utf-8");
  }

  // 🧪 Guardar ficheiro de teste Playwright
  const filename = tc.title
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const filePath = path.join(testsDir, `${filename}.spec.js`);
  fs.writeFileSync(filePath, playwrightCode, "utf-8");

  // 🪶 Guardar passos manuais (se existirem)
  if (tc.manualSteps && tc.manualSteps.length) {
    const stepsPath = path.join(testsDir, `${filename}_manual_steps.json`);
    fs.writeFileSync(stepsPath, JSON.stringify(tc.manualSteps, null, 2), "utf-8");
  }

  return {
    message: `✅ Test files for ticket #${id} saved successfully`,
    title: tc.title,
    saved: {
      test: filePath,
      utils: utilsPath,
    },
  };
}