import fs from "fs"
import path from "path"
import { fileURLToPath } from "url";
import { uploadAllGeneratedTestsToGitHub, uploadTestFileToGitHub } from "./githubFileService.js";

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
  console.log("📤 Uploading generated files to GitHub...");
  const results = await uploadAllGeneratedTestsToGitHub();
  console.log("✅ Upload completo:", results.map((r) => r.url || r.error));
  return { message: "Test files saved successfully", count: data.length,uploaded: results }
}

function extractFunctions(code) {
  const regex = /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{[\s\S]*?\}/gm;
  let matches;
  const funcs = {};
  while ((matches = regex.exec(code)) !== null) {
    funcs[matches[1]] = matches[0];
  }
  return funcs;
}

function validateAndPrepareUtilsCode(rawUtilsCode) {
  if (!rawUtilsCode || typeof rawUtilsCode !== "string") {
    throw new Error("utilsCode está vazio ou não é uma string");
  }

  // Normaliza quebras de linha
  let code = rawUtilsCode.replace(/\r\n/g, "\n").trim();

  // Extrai nomes das funções exportadas
  const helperNames = new Set();
  const fnRegex = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g;
  const constRegex = /export\s+const\s+([A-Za-z0-9_$]+)\s*=/g;
  
  let m;
  while ((m = fnRegex.exec(code)) !== null) {
    helperNames.add(m[1]);
  }
  while ((m = constRegex.exec(code)) !== null) {
    helperNames.add(m[1]);
  }

  // Se não encontrou funções mas tem código, considera válido
  if (helperNames.size === 0 && code.length > 0) {
    return code;
  }

  // Adiciona o comentário de cabeçalho com a lista de helpers
  const namesList = Array.from(helperNames).join(", ");
  const header = `// Exported helpers: ${namesList}\n\n`;

  // Retorna o código final preparado
  return header + code;
}

export async function saveTestFilesForSingleCase(id) {
  // Diretórios base
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, "..");

  const utilsDir = path.join(backendRoot, "tests", "utils");
  const testsDir = path.join(backendRoot, "tests", "generated");

  // Caminho do JSON
  const jsonPath = path.join(backendRoot, "generated_tests.json");
  if (!fs.existsSync(jsonPath)) throw new Error("Nenhum ficheiro generated_tests.json encontrado.");

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Buscar o caso de teste correto
  const tc = data.find((item) => {
    const issueNumber = item.url?.match(/\/issues\/(\d+)$/)?.[1];
    return issueNumber === String(id);
  });
  if (!tc) throw new Error(`Test case não encontrado para o número ${id} no ficheiro generated_tests.json.`);

  // Preparar código
  const utilsCodeRaw = tc.utilsCode?.trim() || "";
  let playwrightCode = tc.playwrightCode?.trim() || "";

  // Corrigir import dos helpers
  playwrightCode = playwrightCode.replace(/from\s+['"].\/utils[^'"]*['"]/, "from '../utils/utils.js'");

  // Criar diretórios se não existirem
  if (!fs.existsSync(utilsDir)) fs.mkdirSync(utilsDir, { recursive: true });
  if (!fs.existsSync(testsDir)) fs.mkdirSync(testsDir, { recursive: true });

  const utilsPath = path.join(utilsDir, "utils.js");

  let existingUtils = "";
  if (fs.existsSync(utilsPath)) {
    existingUtils = fs.readFileSync(utilsPath, "utf-8");
  }

  // Mesclar funções: remove as redefinidas, junta antigas + novas
  const existingFunctions = extractFunctions(existingUtils);
  const newFunctions = extractFunctions(utilsCodeRaw);
  for (const fnName of Object.keys(newFunctions)) {
    delete existingFunctions[fnName];
  }
  const mergedUtils =
    Object.values(existingFunctions).join("\n\n") +
    (Object.values(existingFunctions).length > 0 ? "\n\n" : "") +
    Object.values(newFunctions).join("\n\n");

  // Prepare and validate utils.js before writing
  let preparedUtils;
  try {
    preparedUtils = validateAndPrepareUtilsCode(mergedUtils);
  } catch (err) {
    console.error("Código utils possui erro de validação/preparação, gravação abortada:", err.message);
    throw new Error("Código utils possui erro de sintaxe, gravação abortada.");
  }

  // Sanity syntax check (throws if invalid)
  try {
    new Function(preparedUtils);
  } catch (error) {
    console.error("💥 Código utils inválido após preparação, não será gravado:", error.message);
    throw new Error("Código utils possui erro de sintaxe, gravação abortada.");
  }

  // Write the final utils.js
  fs.writeFileSync(utilsPath, preparedUtils.trim() + "\n", "utf-8");

  // Grava ficheiro do teste Playwright
  const filename = tc.title
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const filePath = path.join(testsDir, `${filename}.spec.js`);
  fs.writeFileSync(filePath, playwrightCode, "utf-8");

  // Passos manuais, se existirem
  if (tc.manualSteps && tc.manualSteps.length) {
    const stepsPath = path.join(testsDir, `${filename}_manual_steps.json`);
    fs.writeFileSync(stepsPath, JSON.stringify(tc.manualSteps, null, 2), "utf-8");
  }

  // Upload GitHub (mantém tua lógica)
  console.log(`📤 A enviar ficheiros do teste #${id} (${filename}.spec.js) para o GitHub...`);
  const repoPathTest = `backend/tests/generated/${filename}.spec.js`;
  const repoPathUtils = `backend/tests/utils/utils.js`;

  try {
    const testUpload = await uploadTestFileToGitHub(filePath, repoPathTest, `Add/Update test for issue #${id}: ${tc.title}`);
    const utilsUpload = await uploadTestFileToGitHub(utilsPath, repoPathUtils, `Update utils.js for test #${id}`);

    console.log("✅ Upload concluído:", {
      test: testUpload.content.html_url,
      utils: utilsUpload.content.html_url,
    });

    return {
      message: `✅ Test files for ticket #${id} saved and uploaded successfully`,
      title: tc.title,
      filename: `${filename}.spec.js`,
      uploaded: {
        test: testUpload.content.html_url,
        utils: utilsUpload.content.html_url,
      },
    };
  } catch (err) {
    console.error("❌ Erro ao enviar para o GitHub:", err.message);
    return {
      message: `⚠️ Test saved locally but failed to upload to GitHub.`,
      title: tc.title,
      error: err.message,
    };
  }
}