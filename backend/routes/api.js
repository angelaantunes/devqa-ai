import path from 'path';
import express from "express";
import {
  getTestCasesFromGitHub,
  runPlaywrightTest,
  generateTestCode,
  getTestResults,
} from "../controllers/githubController.js";  // Importa do controller central (você pode separar)
import { generateTestsFromCases, saveGeneratedTestsController } from "../controllers/openaiController.js";
import { runTestsAndGetReport } from '../controllers/playwrightController.js';

const router = express.Router();

// Listar issues do GitHub como casos de teste
router.get("/test-cases", getTestCasesFromGitHub);

// Rodar teste Playwright a partir do caso
router.post("/run-test", runPlaywrightTest);

// Gerar código teste via OpenAI
router.post("/generate-test", generateTestCode);

// Consultar resultados/logs
router.get("/test-results", getTestResults);

router.post("/generate-tests-from-cases", generateTestsFromCases);

router.post("/save-generated-tests", saveGeneratedTestsController);

router.post('/run-playwright-tests', runTestsAndGetReport);

router.get('/playwright-report', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'playwright-report', 'index.html'));
});

export default router;
