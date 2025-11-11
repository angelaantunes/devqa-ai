import path from 'path';
import express from "express";
import {
  getTestCasesFromGitHub,
  runPlaywrightTest,
  generateTestCode,
  getTestResults,
} from "../controllers/githubController.js";  // Importa do controller central (você pode separar)
import { generateTestsFromCases, saveGeneratedTestsController, generateTestForSingleCase, saveGeneratedTestsSingleCaseController } from "../controllers/openaiController.js";
import { runTestsAndGetReport, runSinglePlaywrightTestController, getTestStatusController } from '../controllers/playwrightController.js';

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

router.post("/save-generated-tests/:id", saveGeneratedTestsSingleCaseController);


router.post('/run-playwright-tests', runTestsAndGetReport);

router.post("/run-playwright-test/:id", runSinglePlaywrightTestController);
router.get("/test-status/:filename", getTestStatusController);

// Generate Playwright test for a single issue/ticket by its GitHub issue number
router.post("/generate-test/:number", generateTestForSingleCase);

// Generate Playwright test for a single issue/ticket with a custom prompt or extra data
//router.post("/generate-test/:number/custom", generateTestForSingleCaseCustom);

router.get('/playwright-report', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'playwright-report', 'index.html'));
});

export default router;
