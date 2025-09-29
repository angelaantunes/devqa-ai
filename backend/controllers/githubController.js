import { fetchGitHubIssues } from "../services/githubService.js";
import { executePlaywrightTest } from "../services/playwrightService.js";
import { generateOpenAITestCode } from "../services/openaiService.js";
import { getAllTestResults } from "../services/playwrightService.js";
import { setTestCases, getTestCases } from "../services/testCaseStore.js";

// Buscar issues abertas no GitHub e transformar em casos de teste (simplificado)
export async function getTestCasesFromGitHub(req, res) {
  try {
    const issues = await fetchGitHubIssues();
    setTestCases(issues); // guarda-os para uso futuro
    res.json(issues);
  } catch (error) {
    console.error("Erro ao buscar issues:", error);
    res.status(500).json({ error: "Erro ao buscar casos" });
  }
}

// Executar teste Playwright baseado em input dinâmico
export async function runPlaywrightTest(req, res) {
  try {
    const testCase = req.body; // ex: { title, steps, url, ... }
    const result = await executePlaywrightTest(testCase);
    res.json(result);
  } catch (error) {
    console.error("Erro na execução do teste:", error);
    res.status(500).json({ error: "Falha na execução do teste" });
  }
}

// Gerar código Playwright via OpenAI API
export async function generateTestCode(req, res) {
  try {
    const { prompt } = req.body;
    const code = await generateOpenAITestCode(prompt);
    res.json({ code });
  } catch (error) {
    console.error("Erro na geração de código:", error);
    res.status(500).json({ error: "Falha na geração de código" });
  }
}

// Consultar resultados e logs
export async function getTestResults(req, res) {
  try {
    const results = getAllTestResults();
    res.json(results);
  } catch (error) {
    console.error("Erro ao obter resultados:", error);
    res.status(500).json({ error: "Falha em resultados" });
  }
}
