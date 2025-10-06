import { Paper, Typography, Accordion, AccordionSummary, AccordionDetails, Link, Divider, Button } from "@mui/material"
import axios from "axios";
import { useState } from "react";
import { ExpandMore } from "@mui/icons-material"

function TestCasesSection({ testCases: initialTestCases }) {
  const [testCases, setTestCases] = useState(initialTestCases);
  const [loadingNumber, setLoadingNumber] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [customPrompts, setCustomPrompts] = useState({});
  const [customLoadingNumber, setCustomLoadingNumber] = useState(null);
  const [showCustomPrompt, setShowCustomPrompt] = useState({});
  const API_URL = import.meta.env.VITE_API_URL;

  const handleGenerateTest = async (number, idx) => {
    setLoadingNumber(number);
    try {
      const res = await axios.post(`${API_URL}/api/generate-test/${number}`);
      const updatedTestCases = [...testCases];
      updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data };
      setTestCases(updatedTestCases);
      alert("✅ Test generated for this ticket!");
    } catch (err) {
      alert("Error generating test for this ticket");
    }
    setLoadingNumber(null);
  };

  const handleCustomPromptChange = (number, value) => {
    setCustomPrompts(prev => ({ ...prev, [number]: value }));
  };

  const handleGenerateTestCustom = async (number, idx) => {
    setCustomLoadingNumber(number);
    try {
      const res = await axios.post(`${API_URL}/api/generate-test/${number}/custom`, {
        customPrompt: customPrompts[number] || ""
      });
      const updatedTestCases = [...testCases];
      updatedTestCases[idx] = { ...updatedTestCases[idx], ...res.data };
      setTestCases(updatedTestCases);
      alert("✅ Custom test generated for this ticket!");
    } catch (err) {
      alert("Error generating custom test for this ticket");
    }
    setCustomLoadingNumber(null);
    setShowCustomPrompt(prev => ({ ...prev, [number]: false }));
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : null);
  };

  const handleEditPromptClick = (number) => {
    setShowCustomPrompt(prev => ({ ...prev, [number]: !prev[number] }));
  };

  if (!testCases.length) return null;
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6">Test Cases</Typography>
      {testCases.map((tc, i) => (
        <Accordion
          key={tc.number || i}
          sx={{ mt: 1 }}
          expanded={expanded === (tc.number || i)}
          onChange={handleAccordionChange(tc.number || i)}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ flexGrow: 1 }}>{tc.title}</Typography>
            <Link href={tc.url} target="_blank" rel="noreferrer" underline="hover">
              Open Ticket
            </Link>
          </AccordionSummary>
          <AccordionDetails>
            <Button
              variant="outlined"
              size="small"
              sx={{ mb: 2 }}
              onClick={() => handleGenerateTest(tc.number, i)}
              disabled={loadingNumber === tc.number}
            >
              {loadingNumber === tc.number ? "Generating..." : "Generate Test"}
            </Button>

            {/* Show Edit Prompt button only after test is generated */}
            {(tc.manualSteps || tc.playwrightCode || tc.utilsCode) && (
              <Button
                variant="text"
                size="small"
                sx={{ mb: 2, ml: 2 }}
                onClick={() => handleEditPromptClick(tc.number)}
              >
                {showCustomPrompt[tc.number] ? "Cancel" : "Edit Prompt & Regenerate"}
              </Button>
            )}

            {/* Custom prompt input and button, only visible after test is generated and when editing */}
            {showCustomPrompt[tc.number] && (
              <div style={{ marginBottom: 16 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Custom Prompt</Typography>
                <textarea
                  style={{ width: "100%", minHeight: 60, marginBottom: 8 }}
                  value={customPrompts[tc.number] || ""}
                  onChange={e => handleCustomPromptChange(tc.number, e.target.value)}
                  placeholder="Enter a custom prompt for this ticket..."
                />
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => handleGenerateTestCustom(tc.number, i)}
                  disabled={customLoadingNumber === tc.number || !customPrompts[tc.number]}
                >
                  {customLoadingNumber === tc.number ? "Generating..." : "Regenerate Test"}
                </Button>
              </div>
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
                    ? tc.manualSteps.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))
                    : tc.manualSteps
                        .split(/\n\d+\.\s|\n|^\d+\.\s/)
                        .filter(s => s.trim())
                        .map((step, j) => (
                          <li key={j}>{step.trim()}</li>
                        ))}
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
  );
}

export default TestCasesSection