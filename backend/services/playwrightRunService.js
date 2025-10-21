import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

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

export async function runRemotePlaywrightTest(testNumber) {
  const repo = process.env.GITHUB_REPO; // ex: 'angelaantunes/devqa-ai'
  const token = process.env.GITHUB_TOKEN; // token com permissão para Actions

  console.log(`🚀 Disparar workflow remoto para teste #${testNumber}`);

  // 1. Dispara o workflow
  const dispatchResp = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/run-single-test.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { testId: testNumber.toString() },
      }),
    }
  );

  if (!dispatchResp.ok) {
    const errText = await dispatchResp.text();
    throw new Error(`Falha ao disparar workflow: ${errText}`);
  }

  console.log("✅ Workflow dispatch enviado com sucesso");

  return {
    message: `Teste #${testNumber} enviado para execução no GitHub Actions`,
    success: true,
    runUrl: `https://github.com/${repo}/actions`, // link genérico
  };
}