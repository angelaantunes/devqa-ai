import { runPlaywrightTests, runSinglePlaywrightTest } from '../services/playwrightRunService.js';

export async function runTestsAndGetReport(req, res) {
  try {
    const result = await runPlaywrightTests();
    res.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
      reportPath: result.reportPath
    });
  } catch (error) {
    console.error("Error running tests:", error);
    res.status(500).json({ error: error.message || "Failed to run tests" });
  }
}

export async function runSinglePlaywrightTestController(req, res) {
  try {
    const { id } = req.params;
    console.log("🎯 Executando teste para ID:", id);

    const result = await runSinglePlaywrightTest(id);
    
    if (!result) {
      return res.status(500).json({ error: "Erro inesperado: resultado vazio" });
    }

    res.json({
      message: `Teste Playwright executado remotamente para o ticket ${id}`,
      success: true,
      reportPath: result.reportPath,
      publishedUrl: result.publishedUrl
    });

  } catch (error) {
    console.error("❌ Erro ao executar teste:", error);
    res.status(500).json({ error: error.error || error.message });
  }
}