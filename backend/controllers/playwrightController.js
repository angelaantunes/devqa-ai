import { runPlaywrightTests, runSinglePlaywrightTest } from '../services/playwrightRunService.js';
import { uploadTestFileToGitHub, uploadAllGeneratedTestsToGitHub } from '../services/githubFileService.js';
import fs from "fs"
import { createTestCase, createTestRun } from '../services/practiTestService.js';

export async function runTestsAndGetReport(req, res) {
  try {
    const result = await runPlaywrightTests();

    //Enviar ficheiros para o GitHub
    const testFiles = await uploadAllGeneratedTestsToGitHub();


    // Exemplo: enviar relatório HTML para o GitHub
    /*await uploadTestFileToGitHub(
  "backend/tests/generated/test.spec.js",
  "tests/test.spec.js",
  "Add generated Playwright test"
);*/

 /*await uploadTestFileToGitHub(
      result.reportPath,
      "reports/playwright-report.html",
      "Add Playwright test report"
    );*/

    if (fs.existsSync("playwright-report/index.html")) {
  await uploadTestFileToGitHub(
    "playwright-report/index.html",
    "reports/playwright-report.html",
    "Add Playwright test report"
  );
} else {
  console.error("Relatório Playwright não encontrado em playwright-report/index.html")
}

/*await uploadTestFileToGitHub(
  result.reportPath,
  "reports/playwright-report.html",
  "Add Playwright test report"
);*/

    // Exemplo para cada test case Playwright
  //  const testCase = await createTestCase("Login Test", "Testa login com credenciais válidas")
    //const testRun = await createTestRun(testCase.data.data.id, "passed", "Execução Playwright OK")

    res.json({
      message: 'Playwright tests executed',
      success: result.success,
      reportPath: result.reportPath,
      stdout: result.stdout,
      stderr: result.stderr,
      githubTestFiles: testFiles
    });
  } catch (error) {
    console.error("Error running tests:", error);
    res.status(500).json({ error: error.message || "Failed to run tests" });
  }
}

export async function runSinglePlaywrightTestController(req, res) {
  try {
    const { id } = req.params;
    const useGithubActions = req.query.remote === 'true';
    console.log(`🎯 Executando teste ${useGithubActions ? 'remoto' : 'local'} para ID:`, id);

    if (useGithubActions) {
      // Upload test files to GitHub first
      const testFiles = await uploadAllGeneratedTestsToGitHub();
      console.log('📤 Arquivos enviados para GitHub:', testFiles);

      // Trigger GitHub Actions
      const result = await runSinglePlaywrightTest(id, true);
      
      return res.json({
        message: `Teste remoto iniciado para o ticket ${id}`,
        success: true,
        publishedUrl: `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO_NAME}/actions`,
        githubTestFiles: testFiles
      });
    }

    // Local execution (should not reach here when remote=true)
    const result = await runSinglePlaywrightTest(id, false);
    return res.json({
      message: `Teste local executado para o ticket ${id}`,
      success: result.success,
      stdout: result.stdout?.trim(),
      stderr: result.stderr?.trim(),
      reportPath: result.reportPath
    });

  } catch (error) {
    console.error("❌ Erro ao executar teste:", error);
    res.status(500).json({ error: error.error || error.message });
  }
}