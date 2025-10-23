import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const GITHUB_API = process.env.GITHUB_API || "https://api.github.com";

export function runPlaywrightTests() {
  return new Promise((resolve, reject) => {
    // Assumindo que o cwd é backend
    const testDir = 'tests/generated';
    const reportDir = 'playwright-report'; // Diretório padrão de relatório HTML

    // Comando correto: apenas aponta a pasta com testes RELATIVAMENTE ao cwd
    // E define o reporter HTML (relatório # gerará na pasta playwright-report automaticamente)
    const command = `npx playwright test ${testDir} --reporter=html`;

    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        reject({ success: false, error: error.message, stdout, stderr });
        return;
      }
      resolve({ success: true, stdout, stderr, reportPath: path.join(process.cwd(), reportDir) });
    });
  });
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
      const jsonPath = path.join(process.cwd(), "generated_tests.json");
      if (!fs.existsSync(jsonPath)) {
        return reject({ error: "Ficheiro generated_tests.json não encontrado" });
      }

      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const tc = data.find((item) => {
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

      const absoluteTestPath = path.join(process.cwd(), "tests", "generated", `${filename}.spec.js`);
      if (!fs.existsSync(absoluteTestPath)) {
        return reject({ error: `Ficheiro de teste não encontrado: ${absoluteTestPath}` });
      }

      // Use relative path so Playwright treats it as a path (not regex)
      const relativeTestPath = path.relative(process.cwd(), absoluteTestPath).replace(/\\/g, "/");

      console.log(`🧪 Running Playwright test (relative path): ${relativeTestPath}`);

      // Use two reporters: line for console output and html to generate report
      // We avoid --project to prevent "Project not found" errors.
      // We pass both reporters separately (Playwright accepts multiple reporter flags).
      //const command = `npx playwright test ${relativeTestPath} --reporter=line --reporter=html`;
      const reportDir = path.join(process.cwd(), "playwright-report");
 const command = `npx playwright test ${relativeTestPath} --reporter=html --output=${reportDir}`;
      console.log("🚀 Executing:", command);

      exec(command, { cwd: process.cwd(), shell: true, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        // Normalize outputs to strings
        const out = (stdout || "").toString();
        const err = (stderr || "").toString();

        if (error) {
          // Return Playwright's stdout/stderr to the caller for debugging
          return reject({ error: error.message, stdout: out, stderr: err });
        }

        // Playwright HTML report is generated at playwright-report/index.html by default
         const reportIndexPath = path.join(reportDir, "index.html");

          if (fs.existsSync(reportIndexPath)) {
            // Cria uma cópia com o nome do teste
            const renamedReport = path.join(reportDir, `${filename}.html`);
            fs.copyFileSync(reportIndexPath, renamedReport);
          }

          // ✅ devolve uma rota pública (/reports/...)
          resolve({
            success: true,
            stdout: out,
            stderr: err,
            reportPath: `/reports/${filename}.html`,
          });
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
      });
    } catch (err) {
      reject({ error: err.message });
    }
  });
}

export async function runRemotePlaywrightTest(testName) {
  const repo = process.env.GITHUB_REPO;  // ex: 'usuario/repositorio'
  const token = process.env.GITHUB_TOKEN;

  console.log(`🚀 Disparar workflow para teste: ${testName}`);

  // 1. Disparar o workflow_dispatch
  let dispatchResp = await fetch(
    `${GITHUB_API}/repos/${repo}/actions/workflows/run-playwright.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { filename: testName }
      }),
    }
  );

  if (!dispatchResp.ok) {
    const text = await dispatchResp.text();
    throw new Error(`Erro ao disparar workflow: ${text}`);
  }
  console.log("✅ Workflow disparado com sucesso");

  // 2. Polling para encontrar a run
  let runId;
  const maxPolls = 30;
  let polls = 0;
  while (!runId && polls < maxPolls) {
    polls++;
    const runsResp = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/runs?event=workflow_dispatch&branch=main`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await runsResp.json();
    if (data.workflow_runs && data.workflow_runs.length > 0) {
      runId = data.workflow_runs[0].id;
      break;
    }
    await new Promise((res) => setTimeout(res, 2000)); // espera 2s
  }
  if (!runId) throw new Error("Não foi possível encontrar workflow run");

  console.log(`🔎 Encontrado run id: ${runId}`);

  // 3. Polling para aguardar conclusão do run
  let conclusion = null;
  while (conclusion === null && polls < maxPolls) {
    polls++;
    const runResp = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/runs/${runId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const runData = await runResp.json();

    if (runData.status === "completed") {
      conclusion = runData.conclusion; // success, failure, cancelled, etc
      break;
    }
    await new Promise((res) => setTimeout(res, 5000)); // espera 5s
  }

  if (conclusion === null) throw new Error("Timeout esperando workflow terminar");

  console.log(`✅ Workflow concluído com status: ${conclusion}`);

  return {
    testName,
    conclusion,
    runUrl: `https://github.com/${repo}/actions/runs/${runId}`,
  };
}