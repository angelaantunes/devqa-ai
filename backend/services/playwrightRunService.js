import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { triggerGitHubAction } from './githubService.js';

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
        return reject({ error: `Teste não encontrado para o issue #${testNumber}` });
      }

      const filename = tc.title
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      const testPath = path.join("tests", "generated", `${filename}.spec.js`);
      if (!fs.existsSync(testPath)) {
        return reject({ error: `Ficheiro de teste não encontrado: ${testPath}` });
      }

      console.log(`🚀 Disparando teste via GitHub Actions...`);
      triggerGitHubAction()
        .then(() => {
          resolve({
            success: true,
            stdout: "Test triggered on GitHub Actions",
            stderr: "",
            reportPath: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO_NAME}/actions/runs/latest`,
            publishedUrl: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO_NAME}/actions`
          });
        })
        .catch(error => reject({ error: error.message }));

    } catch (err) {
      reject({ error: err.message });
    }
  });
}