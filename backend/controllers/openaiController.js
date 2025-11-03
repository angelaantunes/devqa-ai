import { getTestCases } from "../services/testCaseStore.js"
import { generateTestsForCase } from "../services/openaiService.js"
import fs from "fs"
import path from "path"
import { saveGeneratedTestsAsFiles, saveTestFilesForSingleCase } from "../services/saveTestsService.js"
import { uploadTestFileToGitHub } from "../services/githubFileService.js";
// Generate Playwright test for a single test case by index or id
/*export async function generateTestForSingleCaseCustom(req, res) {
  try {
    const { number } = req.params
    //const { customPrompt, extraData, relatedNumbers } = req.body
    const customPrompt = req.body?.customPrompt;
    const extraData = req.body?.extraData;
    const relatedNumbers = req.body.relatedNumbers || [];
    const testCases = getTestCases()
    const testCase = testCases.find((tc) => tc.number == number)
    if (!testCase) {
      return res.status(404).json({ error: "Test case not found" })
    } // Buscar os casos relacionados
    let relatedText = ""
    if (Array.isArray(relatedNumbers) && relatedNumbers.length > 0) {
      const relatedCases = testCases.filter((tc) => relatedNumbers.includes(tc.number))
      relatedCases.forEach((tc, idx) => {
        relatedText += `\n------\nRelated Ticket #${tc.number}\nTitle: ${tc.title}\nDescription: ${tc.body}\nManualSteps: ${Array.isArray(tc.manualSteps) ? tc.manualSteps.join("\n") : tc.manualSteps || ""}\nPlaywrightCode:\n${tc.playwrightCode || ""}\nUtilsCode:\n${tc.utilsCode || ""}\n`
      })
    } // Montar o prompt com dados relacionados
    let prompt = `You are a senior QA automation engineer. Given the following test case from a GitHub issue:\nTitle: ${testCase.title}\nDescription: ${testCase.body}` //if (relatedText) prompt += `\n\nRelated tickets/context:\n${relatedText}`;
    if (relatedText) {
      prompt += `\n\nRelated tickets/context (use as precise data references):\n${relatedText}`
      prompt += `\nImportant: Use URLs, credentials, and all provided data verbatim from related tickets in the generated steps and code. Do NOT substitute with placeholders like "https://www.example.com".\n`
    }
    prompt += `\nYour tasks:\n1. Write a highly detailed, step-by-step list of manual test steps for a QA engineer.\n2. Generate robust Playwright test code in JavaScript that automates the scenario.\n3. Identify any reusable actions and generate helper functions in utils.js.\nReturn a JSON object with keys manualSteps, playwrightCode, utilsCode.`
    if (customPrompt) {
      prompt += `\nAdditional instructions: ${customPrompt}`
    }
    if (extraData) {
      prompt += `\nExtra context: ${extraData}`
    } // Call OpenAI with prompt enriquecido
    const aiResult = await generateTestsForCase({ ...testCase, customPrompt: prompt })
    const result = {
      title: testCase.title,
      url: testCase.url,
      utilsCode: aiResult.utilsCode || "",
      playwrightCode: aiResult.playwrightCode,
      manualSteps: aiResult.manualSteps,
    }
    res.json(result)
  } catch (error) {
    console.error("Error generating test for single case with custom prompt:", error)
    res.status(500).json({ error: "Failed to generate test for single case with custom prompt" })
  }
}*/

export async function generateTestsFromCases(req, res) {
  try {
    const testCases = getTestCases()
    if (!testCases.length) {
      return res.status(400).json({ error: "No test cases stored. Call /api/test-cases first." })
    }

    const results = []
    for (const testCase of testCases) {
      const aiResult = await generateTestsForCase(testCase)
      results.push({
        title: testCase.title,
        url: testCase.url,
        utilsCode: aiResult.utilsCode || "",
        playwrightCode: aiResult.playwrightCode,
        manualSteps: aiResult.manualSteps,
      })
    }

    const filePath = path.join(process.cwd(), "", "generated_tests.json")
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), "utf-8")

    console.log(`✅ Testes gerados e guardados em ${filePath}`)

    res.json(results)
  } catch (error) {
    console.error("Error generating tests from cases:", error)
    res.status(500).json({ error: "Failed to generate tests" })
  }
}

export function saveGeneratedTestsController(req, res) {
  try {
    const result = saveGeneratedTestsAsFiles()
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function saveGeneratedTestsSingleCaseController(req, res) {
   try {
    // Pode ser id, ticketId, testCaseId, etc.,
    const id = req.params.id;
    const result = await saveTestFilesForSingleCase(id)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Generate Playwright test for a single test case by issue number, with custom prompt/data
/*export async function generateTestForSingleCase(req, res) {
  try {
    const { number } = req.params
    //const { customPrompt, extraData } = req.body
    const customPrompt = req.body?.customPrompt;
    const extraData = req.body?.extraData;
    const testCases = getTestCases()
    const testCase = testCases.find((tc) => tc.number == number)
    if (!testCase) {
      return res.status(404).json({ error: "Test case not found" })
    }
    // Always append customPrompt/extraData to the default prompt
    let prompt = `You are a senior QA automation engineer. Given the following test case from a GitHub issue:\nTitle: ${testCase.title}\nDescription: ${testCase.body}`
    prompt += `\nYour tasks:\n1. Write a highly detailed, step-by-step list of manual test steps for a QA engineer.\n2. Generate robust Playwright test code in JavaScript that automates the scenario.\n3. Identify any reusable actions and generate helper functions in utils.js.\nReturn a JSON object with keys manualSteps, playwrightCode, utilsCode.`
    if (customPrompt) {
      prompt += `\nAdditional instructions: ${customPrompt}`
    }
    if (extraData) {
      prompt += `\nExtra context: ${extraData}`
    }
    // Call OpenAI with the combined prompt
    const aiResult = await generateTestsForCase({ ...testCase, customPrompt: prompt })
    const result = {
      title: testCase.title,
      url: testCase.url,
      utilsCode: aiResult.utilsCode || "",
      playwrightCode: aiResult.playwrightCode,
      manualSteps: aiResult.manualSteps,
    }
    res.json(result)
  } catch (error) {
    console.error("Error generating test for single case with custom prompt:", error)
    res.status(500).json({ error: "Failed to generate test for single case with custom prompt" })
  }
}*/

/*export async function generateTestForSingleCase(req, res) {
try {
    const { number } = req.params;
    const customPrompt = req.body?.customPrompt || "";
    const extraData = req.body?.extraData || "";
    const relatedNumbers = req.body?.relatedNumbers || [];

    const testCases = getTestCases();
    const testCase = testCases.find(tc => tc.number == number);
    if (!testCase) {
      return res.status(404).json({ error: "Test case not found" });
    }

    // Construir o texto dos tickets relacionados
    let relatedText = "";
    if (Array.isArray(relatedNumbers) && relatedNumbers.length > 0) {
      const relatedCases = testCases.filter(tc => relatedNumbers.includes(tc.number));
      relatedCases.forEach(tc => {
        relatedText += `\n------\nRelated Ticket #${tc.number}\nTitle: ${tc.title}\nDescription: ${tc.body}\nManualSteps: ${Array.isArray(tc.manualSteps) ? tc.manualSteps.join("\n") : tc.manualSteps || ""}\nPlaywrightCode:\n${tc.playwrightCode || ""}\nUtilsCode:\n${tc.utilsCode || ""}\n`;
      });
    }

    // Criar o prompt base
    let prompt = `You are a senior QA automation engineer. Given the following test case from a GitHub issue:\nTitle: ${testCase.title}\nDescription: ${testCase.body}`;
    if (relatedText) {
      prompt += `\n\nRelated tickets/context (use as precise data references):\n${relatedText}`;
      prompt += `\nImportant: Use URLs, credentials, and all provided data verbatim from related tickets in the generated steps and code. Do NOT substitute with placeholders like "https://www.example.com".\n`;
    }

    prompt += `\nYour tasks:\n1. Write a highly detailed, step-by-step list of manual test steps for a QA engineer.\n2. Generate robust Playwright test code in JavaScript that automates the scenario.\n3. Identify any reusable actions and generate helper functions in utils.js.\nReturn a JSON object with keys manualSteps, playwrightCode, utilsCode.`;

    if (customPrompt) {
      prompt += `\nAdditional instructions: ${customPrompt}`;
    }
    if (extraData) {
      prompt += `\nExtra context: ${extraData}`;
    }

    // Chama o serviço OpenAI
    const aiResult = await generateTestsForCase({ ...testCase, customPrompt: prompt });
    const result = {
      title: testCase.title,
      url: testCase.url,
      utilsCode: aiResult.utilsCode || "",
      playwrightCode: aiResult.playwrightCode,
      manualSteps: aiResult.manualSteps,
    };
    res.json(result);
  } catch (error) {
    console.error("Error generating test for single case with prompt:", error);
    res.status(500).json({ error: "Failed to generate test" });
  }
}*/

export async function generateTestForSingleCase(req, res) {
  try {
    const { number } = req.params;
    const customPrompt = req.body?.customPrompt || "";
    const extraData = req.body?.extraData || "";
    const relatedNumbers = req.body?.relatedNumbers || [];

    const testCases = getTestCases();
    const testCase = testCases.find(tc => tc.number == number);
    if (!testCase) {
      return res.status(404).json({ error: "Test case not found" });
    }

    // Construir texto dos tickets relacionados
    let relatedText = "";
    if (Array.isArray(relatedNumbers) && relatedNumbers.length > 0) {
      const relatedCases = testCases.filter(tc => relatedNumbers.includes(tc.number));
      relatedCases.forEach(tc => {
        relatedText += `\n------\nRelated Ticket #${tc.number}\nTitle: ${tc.title}\nDescription: ${tc.body}\nManualSteps: ${Array.isArray(tc.manualSteps) ? tc.manualSteps.join("\n") : tc.manualSteps || ""}\nPlaywrightCode:\n${tc.playwrightCode || ""}\nUtilsCode:\n${tc.utilsCode || ""}\n`;
      });
    }

    // Construir prompt base
    let prompt = `You are a senior QA automation engineer. Given the following test case from a GitHub issue:\nTitle: ${testCase.title}\nDescription: ${testCase.body}`;
    if (relatedText) {
      prompt += `\n\nRelated tickets/context (use as precise data references):\n${relatedText}`;
      prompt += `\nImportant: Use URLs, credentials, and all provided data verbatim from related tickets in the generated steps and code. Do NOT substitute with placeholders like "https://www.example.com".\n`;
    }

    prompt += `\nYour tasks:\n1. Write a highly detailed, step-by-step list of manual test steps for a QA engineer.\n2. Generate robust Playwright test code in JavaScript ESM that automates the scenario.\n3. Identify any reusable actions and generate helper functions ESM in utils.js.\nReturn a JSON object with keys manualSteps, playwrightCode, utilsCode.`;

    if (customPrompt) {
      prompt += `\nAdditional instructions: ${customPrompt}`;
    }
    if (extraData) {
      prompt += `\nExtra context: ${extraData}`;
    }

    // Chama o serviço OpenAI
    const aiResult = await generateTestsForCase({ ...testCase, customPrompt: prompt });
    const result = {
      number: Number(testCase.number),
      title: testCase.title,
      url: testCase.url,
      utilsCode: aiResult.utilsCode || "",
      playwrightCode: aiResult.playwrightCode || "",
      manualSteps: aiResult.manualSteps || [],
    };

    // Caminho para o ficheiro gerado
    const filePath = path.resolve("generated_tests.json");
    let existingTests = [];

    // Ler o conteúdo existente
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      try {
        existingTests = JSON.parse(content);
      } catch (err) {
        console.warn("⚠️ Ficheiro generated_tests.json estava corrompido, vai ser reescrito.");
        existingTests = [];
      }
    }

    // Atualizar ou adicionar o teste
    const existingIndex = existingTests.findIndex(tc => Number(tc.number) === Number(number));
    if (existingIndex >= 0) {
      existingTests[existingIndex] = result;
      console.log(`📝 Teste #${number} atualizado no ficheiro.`);
    } else {
      existingTests.push(result);
      console.log(`➕ Teste #${number} adicionado ao ficheiro.`);
    }

    // Gravar no ficheiro
    fs.writeFileSync(filePath, JSON.stringify(existingTests, null, 2));

    // 🚀 Upload automático para GitHub
    try {
      await uploadTestFileToGitHub(filePath, "backend/generated_tests.json", `update test case #${number}`);
    } catch (err) {
      console.error("⚠️ Falha ao enviar ficheiro atualizado para GitHub:", err.message);
    }

    // Responder com o novo resultado
    res.json(result);

  } catch (error) {
    console.error("❌ Error generating test for single case:", error);
    res.status(500).json({ error: "Failed to generate test" });
  }
}