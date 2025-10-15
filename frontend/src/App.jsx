import { useState } from "react"
import { Container, Typography, Button, Stack } from "@mui/material"
import { PlayArrow, AutoAwesome, Save, List } from "@mui/icons-material"
import TestCasesSection from "./components/TestCasesSection"
import LogsSection from "./components/LogsSection"
import ReportSection from "./components/ReportSection"
import axios from "axios"

function App() {
  const [section, setSection] = useState(null)
  const [testCases, setTestCases] = useState([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState("")
  const [reportUrl, setReportUrl] = useState(null)
  const [githubTestUrl, setGithubTestUrl] = useState(null)
  const [githubReportUrl, setGithubReportUrl] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchTestCases = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/test-cases`)
      console.log("Backend response:", res.data)
      setTestCases(res.data)
      setSection("testCases")
    } catch (err) {
      alert("Error fetching test cases")
    }
    setLoading(false)
  }

  const generateTests = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/generate-tests-from-cases`)
      setTestCases(res.data)
      alert("✅ Playwright tests generated successfully!")
      setSection("testCases")
    } catch (err) {
      alert("Error generating tests")
    }
    setLoading(false)
  }

  const saveGeneratedTests = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/save-generated-tests`)
      alert(`💾 ${res.data.count} test files saved`)
    } catch (err) {
      alert("Error saving test files")
    }
    setLoading(false)
  }

  const runTests = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/run-playwright-tests`)
      setLogs(res.data.stdout || "")
      setReportUrl(res.data.reportPath)
      setGithubTestUrl(res.data.githubTestUrl)
      setGithubReportUrl(res.data.githubReportUrl)
      setSection("logs")
      if (res.data.githubTestUrl && res.data.githubReportUrl) {
        alert(`Tests sent to GitHub!\n` + `Test: ${res.data.githubTestUrl}\n` + `Report: ${res.data.githubReportUrl}`)
      }
    } catch (err) {
      alert("Error running tests")
    }
    setLoading(false)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        🤖 QA AI Dashboard
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" startIcon={<List />} onClick={fetchTestCases} disabled={loading}>
          Fetch Test Cases
        </Button>
        {/* <Button variant="contained" color="secondary" startIcon={<AutoAwesome />} onClick={generateTests} disabled={loading}>
          Generate Tests
        </Button>
        <Button variant="contained" color="info" startIcon={<Save />} onClick={saveGeneratedTests} disabled={loading}>
          Save Tests
        </Button>
        <Button variant="contained" color="success" startIcon={<PlayArrow />} onClick={runTests} disabled={loading}>
          Run Tests
        </Button> */}
      </Stack>

      {loading && <Typography>Loading...</Typography>}

      {section === "testCases" && <TestCasesSection testCases={testCases} />}
      {section === "logs" && <LogsSection logs={logs} onShowReport={() => setSection("report")} />}
      {section === "report" && <ReportSection reportUrl={reportUrl} githubTestUrl={githubTestUrl} githubReportUrl={githubReportUrl} />}
    </Container>
  )
}

export default App
