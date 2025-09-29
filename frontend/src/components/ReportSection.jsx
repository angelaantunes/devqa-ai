import { Paper, Typography, Divider, Link, Stack } from "@mui/material"

function ReportSection({ reportUrl, githubTestUrl, githubReportUrl }) {
  if (!reportUrl) return null
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Relatório Playwright</Typography>
      <Divider sx={{ my: 1 }} />
      <iframe src={reportUrl} style={{ width: "100%", height: "600px", border: "none" }} title="Relatório Playwright" />
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        {githubTestUrl && (
          <Link href={githubTestUrl} target="_blank" rel="noopener">
            Ver Teste no GitHub
          </Link>
        )}
        {githubReportUrl && (
          <Link href={githubReportUrl} target="_blank" rel="noopener">
            Ver Relatório no GitHub
          </Link>
        )}
      </Stack>
    </Paper>
  )
}

export default ReportSection