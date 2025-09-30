import { Paper, Typography, Divider, Button } from "@mui/material"

function LogsSection({ logs, onShowReport }) {
  if (!logs) return null
  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: "#f5f5f5" }}>
      <Typography variant="h6">Logs de Execução</Typography>
      <Divider sx={{ my: 1 }} />
      <pre style={{ whiteSpace: "pre-wrap" }}>{logs}</pre>
      <Button variant="outlined" sx={{ mt: 2 }} onClick={onShowReport}>
        Report Playwright
      </Button>
    </Paper>
  )
}

export default LogsSection