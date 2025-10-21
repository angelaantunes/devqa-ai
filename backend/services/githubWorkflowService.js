// services/githubWorkflowService.js
import axios from "axios";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const TOKEN = process.env.GITHUB_TOKEN;
const API_BASE = process.env.GITHUB_API || "https://api.github.com";
const WORKFLOW_FILE = process.env.WORKFLOW_FILE || "playwright.yml";

/**
 * Dispatches the workflow (workflow_dispatch) with given inputs.
 * Then polls the latest workflow run for that workflow until it completes (or timeout).
 * Returns { status, conclusion, runHtmlUrl, publishedReportUrl } when finished.
 */
export async function dispatchAndWaitForWorkflow({ filename, issue_number }, opts = {}) {
  if (!TOKEN) throw new Error("GITHUB_TOKEN is required in environment");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
  };

  // 1) Dispatch workflow
  const dispatchUrl = `${API_BASE}/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const ref = opts.ref || "main"; // branch to run from
  await axios.post(
    dispatchUrl,
    {
      ref,
      inputs: {
        filename,
        issue_number: issue_number || "",
      },
    },
    { headers }
  );

  // 2) poll for the newest run for the workflow file
  // Get workflow details first (to ensure it exists)
  const workflowUrl = `${API_BASE}/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}`;
  const wfRes = await axios.get(workflowUrl, { headers });
  const workflowId = wfRes.data.id;

  // helper to list runs
  const runsUrl = `${API_BASE}/repos/${OWNER}/${REPO}/actions/workflows/${workflowId}/runs`;

  // poll until a run has started for this workflow and is finished
  const start = Date.now();
  const timeoutMs = opts.timeoutMs || 5 * 60 * 1000; // default 5min
  let run = null;

  // Wait for a run to appear (it may take a few seconds)
  const waitForRun = async () => {
    const r = await axios.get(runsUrl + "?per_page=10", { headers });
    const runs = r.data.workflow_runs || [];
    if (!runs.length) return null;
    // pick the most recent run
    return runs[0];
  };

  // wait up to timeout for run to appear and complete
  while (Date.now() - start < timeoutMs) {
    // try to fetch the latest run
    const candidate = await waitForRun();
    if (candidate) {
      run = candidate;
      // poll run status
      const runUrl = `${API_BASE}/repos/${OWNER}/${REPO}/actions/runs/${run.id}`;
      // now poll until finished
      while (Date.now() - start < timeoutMs) {
        const runRes = await axios.get(runUrl, { headers });
        const runData = runRes.data;
        if (runData.status === "completed") {
          // finished
          const conclusion = runData.conclusion; // success/failure/cancelled
          // HTML url for run page (useful for debugging)
          const runHtmlUrl = runData.html_url;
          // We expect the workflow to publish the report to GitHub Pages
          // Compose expected report URL:
          // https://<OWNER>.github.io/<REPO>/<filename>.html
          const sanitizedFilename = filename || "report";
          const publishedReportUrl = `https://${OWNER}.github.io/${REPO}/${encodeURIComponent(sanitizedFilename)}.html`;

          return {
            status: "completed",
            conclusion,
            runHtmlUrl,
            publishedReportUrl,
          };
        }
        // not finished yet — wait a bit
        await new Promise((r) => setTimeout(r, 3000));
      }
      // inner poll timed out
      break;
    }
    // no run yet, wait
    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Timeout waiting for workflow run to complete");
}
