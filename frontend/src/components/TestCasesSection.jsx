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

  const [saveLoadingId, setSaveLoadingId] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL

  const handleGenerateTest = async (number, idx) => {
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

  const handleSaveTest = async (id, idx) => {
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

  const handleRunTest = async (id) => {
    try {
      setTestResults((prev) => ({ ...prev, [id]: { loading: true } }))

      const res = await axios.post(`${API_URL}/api/run-playwright-test/${id}`)

      const payload = res.data
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          success: payload.conclusion === "success",
          stdout: payload.stdout || "",
          stderr: payload.stderr || "",
          reportUrl: payload.reportUrl || null,
          runUrl: payload.runUrl || null,
        },
      }))

      alert(`✅ Test finished: ${payload.conclusion}\n\nReport: ${payload.reportUrl || "publishing... (may take a minute)"}`)

      if (payload.reportUrl) {
        window.open(payload.reportUrl, "_blank")
      } else if (payload.runUrl) {
        window.open(payload.runUrl, "_blank")
      }
    } catch (err) {
      console.error(err)
      alert("Error while triggering remote test: " + (err.response?.data?.error || err.message))
      setTestResults((prev) => ({ ...prev, [id]: { loading: false, error: err.message } }))
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
            <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => handleGenerateTest(tc.number, i)} disabled={loadingNumber === tc.number}>
              {loadingNumber === tc.number ? "Generating..." : "Generate Test"}
            </Button>

            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button variant="text" size="small" sx={{ mb: 2, ml: 2 }} onClick={() => handleEditPromptClick(tc.number)}>
                {showCustomPrompt[tc.number] ? "Cancel" : "Edit Prompt & Regenerate"}
              </Button>
            )}
            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button
                variant="outlined"
                size="small"
                sx={{ mb: 2, ml: 2 }}
                onClick={() => handleSaveTest(tc.number, i)}
                disabled={saveLoadingId === tc.id}
              >
                {saveLoadingId === tc.id ? "Saving..." : "Save files"}
              </Button>
            )}
            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button variant="contained" size="small" color="success" sx={{ mb: 2, ml: 2 }} onClick={() => handleRunTest(tc.number)} disabled={saveLoadingId === tc.number}>
                Run Test
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
            {testResults[tc.number] && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
                <Typography variant="subtitle1">🧪 Test Result ({testResults[tc.number].success ? "✅ Passed" : "❌ Failed"})</Typography>

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

            {testResults[tc.number]?.reportPath && (
              <Button variant="outlined" size="small" color="secondary" sx={{ mb: 2, ml: 2 }} onClick={() => window.open(`${API_URL}${testResults[tc.number].reportPath}`, "_blank")}>
                📄 View Full Report
              </Button>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  )
}

export default TestCasesSection
