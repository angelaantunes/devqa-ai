import { Paper, Typography, Accordion, AccordionSummary, AccordionDetails, Link, Divider } from "@mui/material"
import { ExpandMore } from "@mui/icons-material"

function TestCasesSection({ testCases }) {
  if (!testCases.length) return null
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6">Test Cases</Typography>
      {testCases.map((tc, i) => (
        <Accordion key={i} sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ flexGrow: 1 }}>{tc.title}</Typography>
            <Link href={tc.url} target="_blank" rel="noreferrer" underline="hover">
              Abrir Issue
            </Link>
          </AccordionSummary>
          <AccordionDetails>
            {tc.body && (
              <>
                <Typography variant="subtitle1">📝 Conteúdo do Issue</Typography>
                <Typography sx={{ mb: 2 }}>{tc.body}</Typography>
                <Divider sx={{ my: 1 }} />
              </>
            )}
            {tc.manualSteps && (
              <>
                <Typography variant="subtitle1">📋 Passos Manuais</Typography>
                <ol>
                  {tc.manualSteps.map((step, j) => (
                    <li key={j}>{step}</li>
                  ))}
                </ol>
                <Divider sx={{ my: 1 }} />
              </>
            )}
            {tc.playwrightCode && (
              <>
                <Typography variant="subtitle1">💻 Código Playwright</Typography>
                <pre style={{ background: "#f5f5f5", padding: "10px", whiteSpace: "pre-wrap" }}>{tc.playwrightCode}</pre>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Paper>
  )
}

export default TestCasesSection