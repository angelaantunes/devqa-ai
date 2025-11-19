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

  // 2. Salvar cada teste Playwright (garantir nomes únicos)
  const usedFilenames = new Set();
  data.forEach((tc) => {
    let base = getFilenameFromPlaywrightCode(tc.playwrightCode, tc.title);
    const filename = getUniqueFilename(base, usedFilenames, tc.number || tc.url?.match(/\/issues\/(\d+)$/)?.[1]);
    const filePath = path.join(testsDir, `${filename}.spec.js`)
    fs.writeFileSync(filePath, tc.playwrightCode, "utf-8")
  })

  // 3. Salvar manualSteps (opcional)
  data.forEach((tc) => {
    if (tc.manualSteps && tc.manualSteps.length) {
      const base = getFilenameFromPlaywrightCode(tc.playwrightCode, tc.title);
      const filename = getUniqueFilename(base, usedFilenames, tc.number || tc.url?.match(/\/issues\/(\d+)$/)?.[1]);
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
  // Melhora a regex para capturar a função completa até o fechamento da chave
  const regex = /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*{(?:[^{}]*|{[^{}]*})*}/gm;
  let matches;
  const funcs = {};
  while ((matches = regex.exec(code)) !== null) {
    funcs[matches[1]] = matches[0];
  }
  return funcs;
}

function validateAndPrepareUtilsCode(rawUtilsCode) {
  console.log("🔍 Validando utils code:", rawUtilsCode);

  if (!rawUtilsCode || typeof rawUtilsCode !== "string") {
    console.log("❌ utilsCode inválido:", rawUtilsCode);
    throw new Error("utilsCode está vazio ou não é uma string");
  }

  // Verifica se todas as funções estão completas (têm o mesmo número de { e })
  const openBraces = (rawUtilsCode.match(/{/g) || []).length;
  const closeBraces = (rawUtilsCode.match(/}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    console.error("❌ Erro: Função incompleta - número de chaves não corresponde");
    console.error(`Chaves abertas: ${openBraces}, Chaves fechadas: ${closeBraces}`);
    throw new Error("Código utils possui erro de sintaxe: função incompleta");
  }

  // Normaliza quebras de linha
  let code = rawUtilsCode.replace(/\r\n/g, "\n").trim();
  console.log("📝 Código normalizado:", code);

  // Extrai nomes das funções exportadas
  const helperNames = new Set();
  const fnRegex = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g;
  const constRegex = /export\s+const\s+([A-Za-z0-9_$]+)\s*=/g;
  
  let m;
  while ((m = fnRegex.exec(code)) !== null) {
    console.log("✅ Função helper encontrada:", m[1]);
    helperNames.add(m[1]);
  }
  while ((m = constRegex.exec(code)) !== null) {
    console.log("✅ Constante helper encontrada:", m[1]);
    helperNames.add(m[1]);
  }

  // Se não encontrou funções mas tem código, considera válido
  if (helperNames.size === 0) {
    console.log("⚠️ Nenhuma função helper encontrada, mas código presente");
    if (code.includes('export')) {
      console.log("📄 Código contém 'export':", code);
    }
    return code;
  }

  // Adiciona o comentário de cabeçalho com a lista de helpers
  const namesList = Array.from(helperNames).join(", ");
  const header = `// Exported helpers: ${namesList}\n\n`;
  const finalCode = header + code;
  
  console.log("✨ Código final preparado:", finalCode);
  
  return finalCode;
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
    console.log("🔄 Preparando utils code...");
    console.log("📄 Utils code original:", mergedUtils);
    
    preparedUtils = validateAndPrepareUtilsCode(mergedUtils);
    console.log("✅ Utils code preparado com sucesso:", preparedUtils);
  } catch (err) {
    console.error("❌ Erro durante validação/preparação:", err);
    console.error("📄 Código que causou erro:", mergedUtils);
    throw new Error("Código utils possui erro de sintaxe, gravação abortada.");
  }

  // Write the final utils.js
  fs.writeFileSync(utilsPath, preparedUtils.trim() + "\n", "utf-8");

  // Grava ficheiro do teste Playwright
  // For single-case saves include the issue id to avoid filename collisions
  const baseSingle = getFilenameFromPlaywrightCode(playwrightCode, tc.title);
  const filename = `${baseSingle}_issue${id}`;
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

// Extract a filename base from playwrightCode's test.describe title when possible,
// otherwise fallback to the provided fallbackTitle (usually the ticket title).
function getFilenameFromPlaywrightCode(playwrightCode, fallbackTitle) {
  try {
    if (typeof playwrightCode === 'string') {
      // Try to match test.describe('Title' or "Title" or `Title`)
      const m = playwrightCode.match(/test\.describe\s*\(\s*['"`]{1}([^'"`]+?)['"`]{1}\s*,/);
      if (m && m[1]) {
        return sanitizeFilename(m[1]);
      }
      // If no describe, try to extract first test('...') title
      const m2 = playwrightCode.match(/test\s*\(\s*['"`]{1}([^'"`]+?)['"`]{1}\s*,/);
      if (m2 && m2[1]) return sanitizeFilename(m2[1]);
    }
  } catch (err) {
    console.warn('Could not extract describe/title from playwrightCode:', err.message);
  }
  // Fallback to ticket title
  return sanitizeFilename(fallbackTitle || 'test');
}

function sanitizeFilename(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 120) || 'test';
}

function getUniqueFilename(base, usedSet, issueId) {
  let name = sanitizeFilename(base);
  if (!usedSet.has(name)) {
    usedSet.add(name);
    return name;
  }

  // If issueId is provided, prefer to append it for deterministic name
  if (issueId) {
    const candidate = `${name}_issue${issueId}`;
    if (!usedSet.has(candidate)) {
      usedSet.add(candidate);
      return candidate;
    }
  }

  // Otherwise append numeric suffix until unique
  let i = 1;
  while (true) {
    const candidate = `${name}_${i}`;
    if (!usedSet.has(candidate)) {
      usedSet.add(candidate);
      return candidate;
    }
    i++;
  }
}