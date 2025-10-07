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
      const res = await axios.post(`${API_URL}/api/generate-test/${number}/custom`, {
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
      updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data, manualSteps: cleanedSteps }
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
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  )
}

export default TestCasesSection
