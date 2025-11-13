import { exec } from "child_process"
import path from "path"
import fs from "fs"
import { setCompleted } from "../utils/executionStatus.js"

const GITHUB_API = process.env.GITHUB_API || "https://api.github.com"

export function runPlaywrightTests() {
  return new Promise((resolve, reject) => {
    // Assumindo que o cwd é backend
    const testDir = "tests/generated"
    const reportDir = "playwright-report" // Diretório padrão de relatório HTML

    // Comando correto: apenas aponta a pasta com testes RELATIVAMENTE ao cwd
    // E define o reporter HTML (relatório # gerará na pasta playwright-report automaticamente)
    const command = `npx playwright test ${testDir} --reporter=html`

    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject({ success: false, error: error.message, stdout, stderr })
        return
      }
      resolve({ success: true, stdout, stderr, reportPath: path.join(process.cwd(), reportDir) })
    })
  })
}

/*export function runSinglePlaywrightTest(testNumber) {
  return new Promise((resolve, reject) => {
    try {
      const jsonPath = path.join(process.cwd(), "generated_tests.json");
      if (!fs.existsSync(jsonPath)) {
        return reject({ error: "Ficheiro generated_tests.json não encontrado" });
      }

      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

      // Procura o teste certo pelo número do issue
      const tc = data.find(item => {
        const issueNumber = item.url?.match(/\/issues\/(\d+)$/)?.[1];
        return issueNumber === String(testNumber);
      });

      if (!tc) {
        return reject({ error: `Nenhum caso encontrado no generated_tests.json para o número ${testNumber}` });
      }

      const filename = tc.title
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      // Caminho absoluto do ficheiro de teste, com forward slashes
      const testPath = path.resolve('tests', 'generated', `${filename}.spec.js`).replace(/\\/g, '/');

      if (!fs.existsSync(testPath)) {
        return reject({ error: `Ficheiro de teste não encontrado: ${testPath}` });
      }

      console.log(`🎯 Running single test for ID: ${testNumber}`);
      console.log(`🧪 Test file: ${testPath}`);

      // Rodar o teste usando npx playwright
      exec(`npx playwright test "${testPath}" --reporter=line`, { cwd: process.cwd(), shell: true }, (error, stdout, stderr) => {
        if (error) {
          return reject({ error: error.message, stdout, stderr });
        }
        resolve({ success: true, stdout, stderr });
      });

    } catch (err) {
      reject({ error: err.message });
    }
  });
}*/

export function runSinglePlaywrightTest(testNumber) {
  return new Promise((resolve, reject) => {
    try {
      const jsonPath = path.join(process.cwd(), "generated_tests.json")
      if (!fs.existsSync(jsonPath)) {
        return reject({ error: "Ficheiro generated_tests.json não encontrado" })
      }

      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
      const tc = data.find((item) => {
        const issueNumber = item.url?.match(/\/issues\/(\d+)$/)?.[1]
        return issueNumber === String(testNumber)
      })

      if (!tc) {
        return reject({ error: `Nenhum caso encontrado no generated_tests.json para o número ${testNumber}` })
      }

      const filename = tc.title
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")

      const absoluteTestPath = path.join(process.cwd(), "tests", "generated", `${filename}.spec.js`)
      if (!fs.existsSync(absoluteTestPath)) {
        return reject({ error: `Ficheiro de teste não encontrado: ${absoluteTestPath}` })
      }

      // Use relative path so Playwright treats it as a path (not regex)
      const relativeTestPath = path.relative(process.cwd(), absoluteTestPath).replace(/\\/g, "/")

      console.log(`🧪 Running Playwright test (relative path): ${relativeTestPath}`)

      // Use two reporters: line for console output and html to generate report
      // We avoid --project to prevent "Project not found" errors.
      // We pass both reporters separately (Playwright accepts multiple reporter flags).
      //const command = `npx playwright test ${relativeTestPath} --reporter=line --reporter=html`;
      const reportDir = path.join(process.cwd(), "playwright-report")
      const command = `npx playwright test ${relativeTestPath} --reporter=html --output=${reportDir}`
      console.log("🚀 Executing:", command)

      exec(command, { cwd: process.cwd(), shell: true, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        // Normalize outputs to strings
        const out = (stdout || "").toString()
        const err = (stderr || "").toString()

        if (error) {
          // Return Playwright's stdout/stderr to the caller for debugging
          return reject({ error: error.message, stdout: out, stderr: err })
        }

        // Playwright HTML report is generated at playwright-report/index.html by default
        const reportIndexPath = path.join(reportDir, "index.html")

        if (fs.existsSync(reportIndexPath)) {
          // Cria uma cópia com o nome do teste
          const renamedReport = path.join(reportDir, `${filename}.html`)
          fs.copyFileSync(reportIndexPath, renamedReport)
        }

        // ✅ devolve uma rota pública (/reports/...)
        resolve({
          success: true,
          stdout: out,
          stderr: err,
          reportPath: `/reports/${filename}.html`,
        })
        /*const reportIndexPath = path.join(process.cwd(), "playwright-report", "index.html");
        const reportExists = fs.existsSync(reportIndexPath);

        resolve({
          success: true,
          stdout: out,
          stderr: err,
          // Return absolute path for backend; controller can convert to a public URL if needed
          reportPath: reportExists ? reportIndexPath : null,
          reportExists,
        });*/
      })
    } catch (err) {
      reject({ error: err.message })
    }
  })
}

export async function runRemotePlaywrightTest(testName) {
  const repo = process.env.GITHUB_REPO // "angelaantunes/devqa-ai"
  const token = process.env.GITHUB_TOKEN
  const GITHUB_API = process.env.GITHUB_API || "https://api.github.com"

  // 1. Marca o timestamp imediatamente antes do dispatch
  const dispatchStart = new Date();

  // 2. Disparar workflow
  let dispatchResp = await fetch(
    `${GITHUB_API}/repos/${repo}/actions/workflows/playwright.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ ref: "main", inputs: { filename: testName } }),
    }
  );
  if (!dispatchResp.ok) {
    throw new Error(`Erro ao disparar workflow: ${await dispatchResp.text()}`);
  }

  // 3. Polling para encontrar o run certo (timestamp + branch + evento)
  let runId;
  let polls = 0;
  const maxPolls = 60;
  while (!runId && polls < maxPolls) {
    polls++;
    const runResp = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/runs?event=workflow_dispatch&branch=main&per_page=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await runResp.json();
    // Filtra pelo run mais recente criado após o dispatch e com nome correto
    const candidate = data.workflow_runs.find((run) => {
      const runCreated = new Date(run.created_at);
      return (
        runCreated >= dispatchStart &&
        run.head_branch === "main" &&
        run.event === "workflow_dispatch"
      );
    });
    if (candidate) {
      runId = candidate.id;
      break;
    }
    await new Promise((res) => setTimeout(res, 1000));
  }
  if (!runId) throw new Error("Não foi possível encontrar workflow run disparado");

  // 4. Polling até conclusão efetiva do run correto
  let conclusion = null;
  polls = 0; // reinicia polling
  while (conclusion === null && polls < maxPolls) {
    polls++;
    const resp = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/runs/${runId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const runData = await resp.json();
    console.log(`Poll ${polls}: status=${runData.status}, conclusion=${runData.conclusion}, id=${runId}`);

    if (runData.status === "completed") {
      conclusion = runData.conclusion;
      break;
    }
    await new Promise((res) => setTimeout(res, 3000));
  }
  if (conclusion === null) throw new Error("Timeout aguardando finalização do run");

  // 5. Obter artifact e published report URL
  const artifacts = await getArtifacts(runId, repo, token);
  const reportUrl = findReportUrl(artifacts, repo);
  const publishedUrl = `https://${repo.split("/")[0]}.github.io/${repo.split("/")[1]}/${testName}.html`;

  // 6. Esperar pelo upload do novo report (cache freshness)
  await waitForReportUpdate(publishedUrl, 60);

  // 7. Atualiza estado do run para o testName e retorna ao controller
  const result = {
    testName,
    conclusion,
    runUrl: `https://github.com/${repo}/actions/runs/${runId}`,
    reportUrl,
    publishedUrl,
  };
  setCompleted(testName, result);
  return result;
}


// --- mantem estas funções tal como estavam (sem /devqa-ai extra)
async function getArtifacts(runId, repo, token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  }
  const resp = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/artifacts`, { headers })
  if (!resp.ok) throw new Error(`Erro ao buscar artifacts: ${await resp.text()}`)
  const data = await resp.json()
  return data.artifacts
}

function findReportUrl(artifacts, repo) {
  const reportArtifact = artifacts.find((a) => a.name.includes("playwright-report") || a.name.includes("github-pages"))
  if (!reportArtifact) return null
  return `https://github.com/${repo}/actions/artifacts/${reportArtifact.id}`
}

// Helper para esperar que o report novo esteja disponível
/*export async function waitForReportUpdate(publishedUrl, maxWait = 60) {
  let waited = 0
  let lastModified = null
  while (waited < maxWait) {
    try {
      const resp = await fetch(publishedUrl, { method: "HEAD" })
      if (resp.ok) {
        const mod = resp.headers.get("last-modified")
        if (mod && mod !== lastModified) {
          return true // O report foi atualizado!
        }
        lastModified = mod
      }
    } catch (err) {
      // ignore, pode não existir logo de início
    }
    await new Promise((res) => setTimeout(res, 2000))
    waited += 2
  }
  return false // timeout
}*/
export async function waitForReportUpdate(publishedUrl, maxWaitSeconds = 60, intervalMs = 5000) {
  let waited = 0;
  let lastModified = null;

  const options = {
    method: "HEAD",
    headers: lastModified ? { "If-Modified-Since": lastModified } : {}
  };

  while (waited < maxWaitSeconds) {
    try {
      const resp = await fetch(publishedUrl, options);
      if (resp.ok) {
        const mod = resp.headers.get("last-modified");
        // Termina o polling se detecta modificacao ou se mod existe e mudou
        if (mod && mod !== lastModified) {
          return true;
        }
        lastModified = mod;
      } else if (resp.status === 304) {
        // Não modificado, continua polling
      }
    } catch (err) {
      // ignore erro temporário (file não disponível ainda etc)
    }
    await new Promise(res => setTimeout(res, intervalMs));
    waited += intervalMs / 1000;
  }
  return false; // timeout
}
