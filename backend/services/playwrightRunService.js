import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { setCompleted } from "../utils/executionStatus.js";

const GITHUB_API = process.env.GITHUB_API || "https://api.github.com";

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function execCommand(cmd, opts = {}) {
  return new Promise((resolve, reject) => {
    exec(
      cmd,
      { shell: true, maxBuffer: 10 * 1024 * 1024, ...opts },
      (err, stdout, stderr) => {
        if (err) {
          reject({
            error: err.message,
            stdout: stdout?.toString(),
            stderr: stderr?.toString(),
          });
        } else {
          resolve({
            stdout: stdout?.toString() || "",
            stderr: stderr?.toString() || "",
          });
        }
      }
    );
  });
}

async function getArtifacts(runId, repo, token) {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" };
  const resp = await fetch(
    `${GITHUB_API}/repos/${repo}/actions/runs/${runId}/artifacts`,
    { headers }
  );
  if (!resp.ok) throw new Error(`Error fetching artifacts: ${await resp.text()}`);
  const data = await resp.json();
  return data.artifacts;
}

function findReportUrl(artifacts, repo) {
  const artifact = artifacts.find(
    (a) =>
      a.name?.includes("playwright-report") ||
      a.name?.includes("github-pages")
  );
  if (!artifact) return null;
  return `https://github.com/${repo}/actions/artifacts/${artifact.id}`;
}

export async function waitForReportUpdate(url, maxSecs = 60, interval = 5000) {
  let waited = 0;
  let lastMod = null;
  while (waited < maxSecs) {
    try {
      const resp = await fetch(url, { method: "HEAD" });
      if (resp.ok) {
        const mod = resp.headers.get("last-modified");
        if (mod && mod !== lastMod) return true;
        lastMod = mod;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, interval));
    waited += interval / 1000;
  }
  return false;
}

// ---------------------------------------------------------
// Run ALL tests
// ---------------------------------------------------------
export async function runPlaywrightTests() {
  try {
    const reportDir = path.join(process.cwd(), "playwright-report");
    const command = `npx playwright test --reporter=html --output=${reportDir}`;

    const { stdout, stderr } = await execCommand(command, {
      cwd: process.cwd(),
    });

    const indexPath = path.join(reportDir, "index.html");
    const exists = fs.existsSync(indexPath);

    return {
      success: true,
      stdout,
      stderr,
      reportExists: exists,
      reportPath: exists ? `/reports/index.html` : null,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

// ---------------------------------------------------------
// Run a single local test
// ---------------------------------------------------------
export async function runSinglePlaywrightTest(testIdentifier) {
  try {
    let absoluteTestPath = null;
    let fileBase = null;

    // Case 1: Filename / path was passed
    if (
      typeof testIdentifier === "string" &&
      (testIdentifier.includes(".spec.js") ||
        testIdentifier.includes("/") ||
        testIdentifier.includes("\\"))
    ) {
      const norm = testIdentifier.replace(/\\/g, "/");
      const name = path.basename(norm).replace(/\.spec\.js$/i, "");
      fileBase = name;

      absoluteTestPath = path.isAbsolute(norm)
        ? norm
        : path.join(process.cwd(), "tests", "generated", `${name}.spec.js`);

      if (!fs.existsSync(absoluteTestPath)) {
        if (fs.existsSync(norm)) absoluteTestPath = norm;
        else throw new Error(`Test file not found: ${absoluteTestPath}`);
      }
    }

    // Case 2: Issue number
    else if (/^\d+$/.test(testIdentifier)) {
      const jsonPath = path.join(process.cwd(), "generated_tests.json");
      if (!fs.existsSync(jsonPath))
        throw new Error("generated_tests.json not found");

      const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const tc = data.find(
        (i) => i.url?.match(/\/issues\/(\d+)$/)?.[1] === String(testIdentifier)
      );
      if (!tc) throw new Error("Test case not found in JSON");

      fileBase =
        tc.filename ||
        tc.title
          ?.toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");

      absoluteTestPath = path.join(
        process.cwd(),
        "tests",
        "generated",
        `${fileBase}.spec.js`
      );

      if (!fs.existsSync(absoluteTestPath))
        throw new Error(`Test file not found: ${absoluteTestPath}`);
    }

    // Case 3: treated as filename base
    else {
      fileBase = testIdentifier.replace(/\.spec\.js$/i, "");
      absoluteTestPath = path.join(
        process.cwd(),
        "tests",
        "generated",
        `${fileBase}.spec.js`
      );
      if (!fs.existsSync(absoluteTestPath))
        throw new Error(`Test file not found: ${absoluteTestPath}`);
    }

    // Run test
    const relativePath = path
      .relative(process.cwd(), absoluteTestPath)
      .replace(/\\/g, "/");

    const reportDir = path.join(process.cwd(), "playwright-report");
    const command = `npx playwright test ${relativePath} --reporter=html --output=${reportDir}`;

    const { stdout, stderr } = await execCommand(command, {
      cwd: process.cwd(),
    });

    // Copy report as unique file
    const index = path.join(reportDir, "index.html");
    if (fs.existsSync(index)) {
      fs.copyFileSync(index, path.join(reportDir, `${fileBase}.html`));
    }

    return {
      success: true,
      stdout,
      stderr,
      reportPath: `/reports/${fileBase}.html`,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}

// ---------------------------------------------------------
// Run test remotely via GitHub Actions
// ---------------------------------------------------------
export async function runRemotePlaywrightTest(testName) {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token)
    throw new Error("GITHUB_REPO or GITHUB_TOKEN missing.");

  const dispatchStart = new Date();

  const resp = await fetch(
    `${GITHUB_API}/repos/${repo}/actions/workflows/playwright.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ ref: "main", inputs: { filename: testName } }),
    }
  );

  if (!resp.ok)
    throw new Error(`Workflow dispatch failed: ${await resp.text()}`);

  // Poll for workflow run
  let runId = null;
  for (let i = 0; i < 60 && !runId; i++) {
    const runResp = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/runs?event=workflow_dispatch&branch=main`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await runResp.json();

    const candidate = data.workflow_runs?.find((r) => {
      const created = new Date(r.created_at);
      return (
        created >= dispatchStart &&
        r.head_branch === "main" &&
        r.event === "workflow_dispatch"
      );
    });

    if (candidate) runId = candidate.id;
    else await new Promise((r) => setTimeout(r, 1000));
  }

  if (!runId) throw new Error("Could not find dispatched workflow run");

  // Wait for completion
  let conclusion = null;
  for (let i = 0; i < 60 && conclusion === null; i++) {
    const r = await fetch(
      `${GITHUB_API}/repos/${repo}/actions/runs/${runId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const d = await r.json();
    if (d.status === "completed") {
      conclusion = d.conclusion;
      break;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  if (!conclusion)
    throw new Error("Timeout waiting for workflow completion");

  // Get artifacts
  const artifacts = await getArtifacts(runId, repo, token);
  const reportUrl = findReportUrl(artifacts, repo);

  const publishedUrl = `https://${repo.split("/")[0]}.github.io/${
    repo.split("/")[1]
  }/${testName}.html`;

  await waitForReportUpdate(publishedUrl);

  const result = {
    testName,
    conclusion,
    runUrl: `https://github.com/${repo}/actions/runs/${runId}`,
    reportUrl,
    publishedUrl,
  };

  setCompleted(testName, result);
  return result;
}
