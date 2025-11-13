import { Paper, Typography, Accordion, AccordionSummary, AccordionDetails, Link, Divider, Button } from "@mui/material"
import axios from "axios"
import { useState } from "react"
import { ExpandMore } from "@mui/icons-material"
import Box from "@mui/material/Box"
import TextareaAutosize from "@mui/material/TextareaAutosize"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"

function TestCasesSection({ testCases: initialTestCases }) {
  const [testCases, setTestCases] = useState(initialTestCases)
  const [loadingNumber, setLoadingNumber] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [customPrompts, setCustomPrompts] = useState({})
  const [customLoadingNumber, setCustomLoadingNumber] = useState(null)
  const [showCustomPrompt, setShowCustomPrompt] = useState({})
  const [relatedNumbers, setRelatedNumbers] = useState({})
  const [testResults, setTestResults] = useState({})
  const [generateBothScenarios, setGenerateBothScenarios] = useState({})

  const [saveLoadingId, setSaveLoadingId] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL

  /*const handleGenerateTest = async (number, idx) => {
    setLoadingNumber(number)
    try {
      const res = await axios.post(`${API_URL}/api/generate-test/${number}`)
      const updatedTestCases = [...testCases]
      updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data }
      setTestCases(updatedTestCases)
      alert("✅ Test generated for this ticket!")
    } catch (err) {
      alert("Error generating test for this ticket")
    }
    setLoadingNumber(null)
  }*/

  const handleGenerateTest = async (number, idx) => {
    setLoadingNumber(number)

    try {
      // Verifica se checkbox está ativada
      const both = generateBothScenarios[number]

      // Por default gera apenas positivo
      if (!both) {
        // Gera só um cenário
        const res = await axios.post(`${API_URL}/api/generate-test/${number}`, { scenario: "positive" })
        // Atualiza testCase desse idx
        const updatedTestCases = [...testCases]
        updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data, scenario: "positive" }
        setTestCases(updatedTestCases)
        alert("✅ Teste positivo gerado!")
      } else {
        // Gera ambos
        const [resPos, resNeg] = await Promise.all([axios.post(`${API_URL}/api/generate-test/${number}`, { scenario: "positive" }), axios.post(`${API_URL}/api/generate-test/${number}`, { scenario: "negative" })])

        // Junta os dois cenários ao testCases desse ticket
        const updatedTestCases = [...testCases]
        updatedTestCases[idx] = {
          ...updatedTestCases[idx],
          positive: { ...resPos.data, scenario: "positive" },
          negative: { ...resNeg.data, scenario: "negative" },
        }
        setTestCases(updatedTestCases)
        alert("✅ Testes positivo e negativo gerados!")
      }
    } catch (err) {
      alert("Erro ao gerar testes para este ticket")
    }
    setLoadingNumber(null)
  }

  const handleCustomPromptChange = (number, value) => {
    setCustomPrompts((prev) => ({ ...prev, [number]: value }))
  }

  const handleGenerateTestCustom = async (number, idx, related = []) => {
    setCustomLoadingNumber(number)
    try {
      const res = await axios.post(`${API_URL}/api/generate-test/${number}`, {
        customPrompt: customPrompts[number] || "",
        relatedNumbers: related,
      })

      const cleanedSteps = Array.isArray(res.data.manualSteps)
        ? res.data.manualSteps
        : res.data.manualSteps
            .split(/\n\d+\.\s|\n|^\d+\.\s/)
            .filter((s) => s.trim())
            .map((s) => s.trim())

      const updatedTestCases = [...testCases]
      //updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data }
      //updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data, manualSteps: cleanedSteps }
      updatedTestCases[idx] = {
        ...updatedTestCases[idx],
        ...res.data,
        manualSteps: cleanedSteps,
      }
      setTestCases(updatedTestCases)
      alert("✅ Custom test generated for this ticket!")
    } catch (err) {
      alert("Error generating custom test for this ticket")
    }
    setCustomLoadingNumber(null)
    setShowCustomPrompt((prev) => ({ ...prev, [number]: false }))
  }

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : null)
  }

  const handleEditPromptClick = (number) => {
    setShowCustomPrompt((prev) => ({ ...prev, [number]: !prev[number] }))
  }

  /*const handleSaveTest = async (id, idx) => {
    setSaveLoadingId(id)
    try {
      const res = await axios.post(`${API_URL}/api/save-generated-tests/${id}`)

      const updatedTestCases = [...testCases]
      updatedTestCases[idx] = {
        ...updatedTestCases[idx],
        filename: res.data.filename, // guarda o nome do ficheiro
      }
      setTestCases(updatedTestCases)

      alert(`✅ Teste guardado para este ticket!\nFicheiro: ${res.data.filename}`)
    } catch (err) {
      alert("Erro ao guardar o teste!")
    }
    setSaveLoadingId(null)
  }*/
  const handleSaveTest = async (id, idx, scenario = "positive") => {
    setSaveLoadingId(id)
    try {
      // Passa cenário para backend para salvar o teste correto
      const res = await axios.post(`${API_URL}/api/save-generated-tests/${id}`, { scenario })

      const updatedTestCases = [...testCases]
      if (scenario === "positive") {
        updatedTestCases[idx].positive = {
          ...updatedTestCases[idx].positive,
          filename: res.data.filename,
        }
      } else {
        updatedTestCases[idx].negative = {
          ...updatedTestCases[idx].negative,
          filename: res.data.filename,
        }
      }

      setTestCases(updatedTestCases)
      alert(`✅ Teste ${scenario} guardado para este ticket!\nFicheiro: ${res.data.filename}`)
    } catch (err) {
      alert("Erro ao guardar o teste!")
    }
    setSaveLoadingId(null)
  }

  /*const handleRunTest = async (id) => {
    try {
      const res = await axios.post(`${API_URL}/api/run-playwright-test/${id}`)
      alert(`✅ Test for ticket ${id} executed!\n\n${res.data.stdout}`)
    } catch (err) {
      console.error(err)
      alert(`❌ Error running test for ticket ${id}`)
    }
  }*/

  /*const handleRunTest = async (id, filename) => {
    console.log("RunTest called", { id, filename })
    setTestResults((prev) => ({ ...prev, [id]: { loading: true } }))

    if (!filename) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { loading: false, error: "Ficheiro não disponível! Salva antes o teste." },
      }))
      return
    }

    // Dispara o teste remotamente
    try {
      const res = await axios.post(`${API_URL}/api/run-playwright-test/${id}`)
      // Resposta esperada: { status: "pending", testName: filename }
      if (res.data.status === "pending" && res.data.testName) {
        pollTestStatus(id, res.data.testName)
        return
      }
      // Caso backend já esteja pronto, trata resultado normal (opcional para local)
      setTestResults((prev) => ({ ...prev, [id]: { loading: false, ...res.data } }))
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [id]: { loading: false, error: err.message } }))
    }
  }*/

  const handleRunTest = async (id, filename, scenario = "positive") => {
    console.log("RunTest called", { id, filename, scenario })
    setTestResults((prev) => ({ ...prev, [`${id}-${scenario}`]: { loading: true } }))

    if (!filename) {
      setTestResults((prev) => ({
        ...prev,
        [`${id}-${scenario}`]: { loading: false, error: "Ficheiro não disponível! Salva antes o teste." },
      }))
      return
    }

    try {
      const res = await axios.post(`${API_URL}/api/run-playwright-test/${id}`, { scenario })
      if (res.data.status === "pending" && res.data.testName) {
        pollTestStatus(`${id}-${scenario}`, res.data.testName)
        return
      }
      setTestResults((prev) => ({ ...prev, [`${id}-${scenario}`]: { loading: false, ...res.data } }))
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [`${id}-${scenario}`]: { loading: false, error: err.message } }))
    }
  }

  /*const pollTestStatus = async (id, filename) => {
    let tries = 0
    const maxTries = 60

    while (tries < maxTries) {
      tries++
      try {
        const res = await axios.get(`${API_URL}/api/test-status/${filename}`)
        // Espera resposta: { status: "pending"/"completed", reportUrl, publishedUrl, ... }
        if (res.data.status === "pending") {
          setTestResults((prev) => ({ ...prev, [id]: { loading: true } }))
        } else if (res.data.status === "completed") {
          setTestResults((prev) => ({
            ...prev,
            [id]: {
              loading: false,
              success: res.data.conclusion === "success",
              publishedUrl: res.data.publishedUrl,
              runUrl: res.data.runUrl,
              reportUrl: res.data.reportUrl,
              stdout: res.data.stdout,
              stderr: res.data.stderr,
            },
          }))
          break
        }
      } catch (err) {
        setTestResults((prev) => ({ ...prev, [id]: { loading: false, error: err.message } }))
        break
      }
      await new Promise((res) => setTimeout(res, 3000))
    }

    if (tries >= maxTries) {
      setTestResults((prev) => ({ ...prev, [id]: { loading: false, error: "Timeout esperando resultado do teste." } }))
    }
  }*/

  const pollTestStatus = async (key, filename) => {
    let tries = 0
    const maxTries = 60

    while (tries < maxTries) {
      tries++
      try {
        const res = await axios.get(`${API_URL}/api/test-status/${filename}`)
        if (res.data.status === "pending") {
          setTestResults((prev) => ({ ...prev, [key]: { loading: true } }))
        } else if (res.data.status === "completed") {
          setTestResults((prev) => ({
            ...prev,
            [key]: {
              loading: false,
              success: res.data.conclusion === "success",
              publishedUrl: res.data.publishedUrl,
              runUrl: res.data.runUrl,
              reportUrl: res.data.reportUrl,
              stdout: res.data.stdout,
              stderr: res.data.stderr,
            },
          }))
          break
        }
      } catch (err) {
        setTestResults((prev) => ({ ...prev, [key]: { loading: false, error: err.message } }))
        break
      }
      await new Promise((res) => setTimeout(res, 3000))
    }

    if (tries >= maxTries) {
      setTestResults((prev) => ({ ...prev, [key]: { loading: false, error: "Timeout esperando resultado do teste." } }))
    }
  }

  const openReport = (id) => {
    const result = testResults[id]
    if (!result) return

    if (result.publishedUrl) {
      window.open(result.publishedUrl, "_blank")
    } else if (result.reportUrl) {
      alert("O relatório ainda está sendo processado. Aguarde alguns minutos e tente novamente.")
    } else if (result.runUrl) {
      window.open(result.runUrl, "_blank")
    } else {
      alert("Relatório indisponível no momento.")
    }
  }

  if (!testCases.length) return null
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6">Test Cases</Typography>
      {testCases.map((tc, i) => (
        <Accordion key={tc.number || i} sx={{ mt: 1 }} expanded={expanded === (tc.number || i)} onChange={handleAccordionChange(tc.number || i)}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ flexGrow: 1 }}>{tc.title}</Typography>
            <Link href={tc.url} target="_blank" rel="noreferrer" underline="hover">
              Open Ticket
            </Link>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <label>
                <input type="checkbox" checked={generateBothScenarios[tc.number] || false} onChange={(e) => setGenerateBothScenarios((prev) => ({ ...prev, [tc.number]: e.target.checked }))} style={{ marginRight: 8 }} />
                Generate positive and negative scenario
              </label>
            </Box>

            <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => handleGenerateTest(tc.number, i)} disabled={loadingNumber === tc.number}>
              {loadingNumber === tc.number ? "Generating..." : "Generate Test"}
            </Button>

            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button variant="text" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleEditPromptClick(tc.number)}>
                {showCustomPrompt[tc.number] ? "Cancel" : "Edit Prompt & Regenerate"}
              </Button>
            )}
            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button variant="outlined" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleSaveTest(tc.number, i)} disabled={saveLoadingId === tc.id}>
                {saveLoadingId === tc.id ? "Saving..." : "Save files"}
              </Button>
            )}

            {(tc.positive?.manualSteps || tc.positive?.playwrightCode || tc.positive?.utilsCode) && (
              <Button variant="outlined" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleSaveTest(tc.number, i, "positive")} disabled={saveLoadingId === tc.id}>
                Save Positive Scenario Files
              </Button>
            )}

            {(tc.negative?.manualSteps || tc.negative?.playwrightCode || tc.negative?.utilsCode) && (
              <Button variant="outlined" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleSaveTest(tc.number, i, "negative")} disabled={saveLoadingId === tc.id}>
                Save Negative Scenario Files
              </Button>
            )}

            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button
                variant="contained"
                size="small"
                color="success"
                sx={{ mb: 2, ml: 2 }}
                onClick={() => handleRunTest(tc.number, tc.filename)} // Passa filename do teste salvo
                disabled={saveLoadingId === tc.number}
              >
                Run Test
              </Button>
            )}
            {(tc.positive?.manualSteps || tc.positive?.playwrightCode || tc.positive?.utilsCode) && (
              <Button variant="contained" color="success" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleRunTest(tc.number, tc.positive?.filename, "positive")} disabled={saveLoadingId === tc.number}>
                Run Test - Positive Scenario
              </Button>
            )}

            {(tc.negative?.manualSteps || tc.negative?.playwrightCode || tc.negative?.utilsCode) && (
              <Button variant="contained" color="error" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleRunTest(tc.number, tc.negative?.filename, "negative")} disabled={saveLoadingId === tc.number}>
                Run Test - Negative Scenario
              </Button>
            )}

            {/* Custom prompt input and related tickets, agrupados para visual mais amigável */}
            {showCustomPrompt[tc.number] && (
              <Box display="flex" flexDirection="column" gap={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Custom Prompt
                  </Typography>
                  <TextareaAutosize minRows={3} style={{ width: "100%", resize: "vertical", marginBottom: 8 }} value={customPrompts[tc.number] || ""} onChange={(e) => handleCustomPromptChange(tc.number, e.target.value)} placeholder="Enter a custom prompt for this ticket..." />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Related Tickets
                  </Typography>
                  <Autocomplete
                    multiple
                    options={testCases.filter((opt) => opt.number !== tc.number)}
                    getOptionLabel={(opt) => `${opt.number} - ${opt.title}`}
                    onChange={(_, newValue) =>
                      setRelatedNumbers((prev) => ({
                        ...prev,
                        [tc.number]: newValue.map((opt) => opt.number),
                      }))
                    }
                    value={testCases.filter((opt) => (relatedNumbers[tc.number] || []).includes(opt.number))}
                    renderInput={(params) => <TextField {...params} label="Related tickets" />}
                    sx={{ my: 1 }}
                  />
                </Box>
                <Button variant="contained" color="secondary" size="small" onClick={() => handleGenerateTestCustom(tc.number, i, relatedNumbers[tc.number] || [])} disabled={customLoadingNumber === tc.number || !((customPrompts[tc.number] && customPrompts[tc.number].trim().length > 0) || relatedNumbers[tc.number]?.length > 0)}>
                  {customLoadingNumber === tc.number ? "Generating..." : "Regenerate Test"}
                </Button>
              </Box>
            )}

            {/* {tc.body && (
              <>
                <Typography variant="subtitle1">📝 Content</Typography>
                <Typography sx={{ mb: 2 }}>{tc.body}</Typography>
                <Divider sx={{ my: 1 }} />
              </>
            )}
            {tc.manualSteps && (
              <>
                <Typography variant="subtitle1">📋 Manual Steps</Typography>
                <ol>
                  {Array.isArray(tc.manualSteps)
                    ? tc.manualSteps.map((step, j) => <li key={j}>{step}</li>)
                    : tc.manualSteps
                        .split(/\n\d+\.\s|\n|^\d+\.\s/)
                        .filter((s) => s.trim())
                        .map((step, j) => <li key={j}>{step.trim()}</li>)}
                </ol>
                <Divider sx={{ my: 1 }} />
              </>
            )}
            {tc.playwrightCode && (
              <>
                <Typography variant="subtitle1">💻 Playwright Code</Typography>
                <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.playwrightCode}</pre>
              </>
            )}
            {tc.utilsCode && tc.utilsCode.trim() && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1">🔧 Helper Functions (utils.js)</Typography>
                <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.utilsCode}</pre>
              </>
            )} */}

            {tc.positive || tc.negative ? (
              <>
                {tc.positive && (
                  <Box sx={{ background: "#edf6ed", p: 2, borderRadius: 2, mb: 2 }}>
                    <Typography variant="subtitle1">👍 Positive Scenario</Typography>
                    {tc.positive.manualSteps && (
                      <>
                        <Typography variant="subtitle2">Manual Steps:</Typography>
                        <ol>
                          {tc.positive.manualSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <Divider sx={{ my: 1 }} />
                      </>
                    )}
                    {tc.positive.playwrightCode && (
                      <>
                        <Typography variant="subtitle2">Playwright Code:</Typography>
                        <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.positive.playwrightCode}</pre>
                      </>
                    )}
                    {tc.positive.utilsCode && tc.positive.utilsCode.trim() && (
                      <>
                        <Typography variant="subtitle2">Helper Functions (utils.js):</Typography>
                        <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.positive.utilsCode}</pre>
                      </>
                    )}
                  </Box>
                )}
                {tc.negative && (
                  <Box sx={{ background: "#ffeded", p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1">👎 Negative Scenario</Typography>
                    {tc.negative.manualSteps && (
                      <>
                        <Typography variant="subtitle2">Manual Steps:</Typography>
                        <ol>
                          {tc.negative.manualSteps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <Divider sx={{ my: 1 }} />
                      </>
                    )}
                    {tc.negative.playwrightCode && (
                      <>
                        <Typography variant="subtitle2">Playwright Code:</Typography>
                        <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.negative.playwrightCode}</pre>
                      </>
                    )}
                    {tc.negative.utilsCode && tc.negative.utilsCode.trim() && (
                      <>
                        <Typography variant="subtitle2">Helper Functions (utils.js):</Typography>
                        <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.negative.utilsCode}</pre>
                      </>
                    )}
                  </Box>
                )}
              </>
            ) : (
              // Caso antigo, mostras como já fazias!
              <>
                {tc.body && (
                  <>
                    <Typography variant="subtitle1">📝 Content</Typography>
                    <Typography sx={{ mb: 2 }}>{tc.body}</Typography>
                    <Divider sx={{ my: 1 }} />
                  </>
                )}
                {tc.manualSteps && (
                  <>
                    <Typography variant="subtitle1">📋 Manual Steps</Typography>
                    <ol>
                      {Array.isArray(tc.manualSteps)
                        ? tc.manualSteps.map((step, j) => <li key={j}>{step}</li>)
                        : tc.manualSteps
                            .split(/\n\d+\.\s|\n|^\d+\.\s/)
                            .filter((s) => s.trim())
                            .map((step, j) => <li key={j}>{step.trim()}</li>)}
                    </ol>
                    <Divider sx={{ my: 1 }} />
                  </>
                )}
                {tc.playwrightCode && (
                  <>
                    <Typography variant="subtitle1">💻 Playwright Code</Typography>
                    <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.playwrightCode}</pre>
                  </>
                )}
                {tc.utilsCode && tc.utilsCode.trim() && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1">🔧 Helper Functions (utils.js)</Typography>
                    <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.utilsCode}</pre>
                  </>
                )}
              </>
            )}

            {testResults[tc.number] && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                <Typography variant="subtitle1">🧪 Test Result ({testResults[tc.number].loading ? "⏳ Running..." : testResults[tc.number].success ? "✅ Passed" : "❌ Failed"})</Typography>

                {testResults[tc.number].loading ? (
                  <Typography variant="body2" color="text.secondary">
                    Running test...
                  </Typography>
                ) : (
                  <>
                    {testResults[tc.number].stdout && (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                          Output:
                        </Typography>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9em" }}>{testResults[tc.number].stdout}</pre>
                      </>
                    )}

                    {testResults[tc.number].stderr && (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1, color: "red" }}>
                          Errors:
                        </Typography>
                        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.9em", color: "red" }}>{testResults[tc.number].stderr}</pre>
                      </>
                    )}
                  </>
                )}
              </Box>
            )}

            {testResults[tc.number]?.publishedUrl && (
              // <Button variant="outlined" size="small" color="secondary" sx={{ mb: 2, ml: 2 }} onClick={() => openReport(tc.number)}>
              //   📄 View Full Report
              // </Button>
              <div style={{ marginTop: "20px" }}>
                <Typography variant="h6">Full Report</Typography>
                <iframe src={`${testResults[tc.number].publishedUrl}?ts=${Date.now()}`} style={{ width: "100%", height: "600px", border: "1px solid #ccc" }} title="Relatório Playwright" />
              </div>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  )
}

export default TestCasesSection
