import { runPlaywrightTests, runSinglePlaywrightTest  } from '../services/playwrightRunService.js';
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
    console.error("Erro no runTestsAndGetReport:", error)
    res.status(500).json({ error: error.error || error.message, stdout: error.stdout, stderr: error.stderr });
  }
}

export async function runSinglePlaywrightTestController(req, res) {
  try {
    const { id } = req.params;
    console.log("🎯 Executando teste para ID:", id);

    const result = await runSinglePlaywrightTest(id, true); // true = usar GitHub Actions
    
    if (!result) {
      return res.status(500).json({ error: "Erro inesperado: resultado vazio" });
    }

    if (result.isRemote) {
      // Retorno específico para execução remota
      return res.json({
        message: `Teste Playwright executado remotamente para o ticket ${id}`,
        success: result.success,
        reportPath: result.reportPath || null,
        remoteUrl: result.remoteUrl || null, // URL do resultado remoto, se aplicável
      });
    }

    res.json({
      message: `Playwright test executed for ticket ${id}`,
      success: result.success,
      /*stdout: result.stdout,
      stderr: result.stderr*/
      stdout: result.stdout?.trim(),
      stderr: result.stderr?.trim(),
      reportPath: result.reportPath || null,
    });
  } catch (error) {
    console.error("❌ Erro ao executar teste:", error);
    res.status(500).json({
      error: error.error || error.message,
      stdout: error.stdout?.trim(),
      stderr: error.stderr?.trim(),
    });
  }
}