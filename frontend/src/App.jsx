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
      console.log("Resposta do backend:", res.data)
      setTestCases(res.data)
      setSection("testCases")
    } catch (err) {
      alert("Erro ao buscar test cases")
    }
    setLoading(false)
  }

  const generateTests = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/generate-tests-from-cases`)
      setTestCases(res.data)
      alert("✅ Testes Playwright gerados com sucesso!")
      setSection("testCases")
    } catch (err) {
      alert("Erro ao gerar testes")
    }
    setLoading(false)
  }

  const saveGeneratedTests = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/api/save-generated-tests`)
      alert(`💾 ${res.data.count} ficheiros de teste guardados`)
    } catch (err) {
      alert("Erro ao salvar ficheiros de teste")
    }
    setLoading(false)
  }

  /*const runTests = async () => {
    setLoading(true)
    try {
      const res = await axios.post("/api/run-playwright-tests")
      setLogs(res.data.stdout || "")
      setReportUrl("/api/playwright-report")
      setSection("logs")
    } catch (err) {
      alert("Erro ao executar testes")
    }
    setLoading(false)
  }*/

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
        alert(`Testes enviados para o GitHub!\n` + `Test: ${res.data.githubTestUrl}\n` + `Report: ${res.data.githubReportUrl}`)
      }
    } catch (err) {
      alert("Erro ao executar testes")
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
          Buscar Test Cases
        </Button>
        <Button variant="contained" color="secondary" startIcon={<AutoAwesome />} onClick={generateTests} disabled={loading}>
          Gerar Testes
        </Button>
        <Button variant="contained" color="info" startIcon={<Save />} onClick={saveGeneratedTests} disabled={loading}>
          Salvar Testes
        </Button>
        <Button variant="contained" color="success" startIcon={<PlayArrow />} onClick={runTests} disabled={loading}>
          Executar Testes
        </Button>
      </Stack>

      {loading && <Typography>Carregando...</Typography>}

      {section === "testCases" && <TestCasesSection testCases={testCases} />}
      {section === "logs" && <LogsSection logs={logs} onShowReport={() => setSection("report")} />}
      {/* {section === "report" && <ReportSection reportUrl={reportUrl} />} */}
      {section === "report" && <ReportSection reportUrl={reportUrl} githubTestUrl={githubTestUrl} githubReportUrl={githubReportUrl} />}
    </Container>
  )
}

export default App
