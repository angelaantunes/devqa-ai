import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Use environment variables instead of hardcoded values
const OWNER = process.env.GITHUB_OWNER || "angelaantunes";
const REPO = process.env.GITHUB_REPO_NAME || "devqa-ai";

export async function fetchGitHubIssues() {
  const { data } = await octokit.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    state: "open",
    labels: "test-case",
  });

  return data.map(issue => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    url: issue.html_url,
  }));
}

// Add function to trigger GitHub Actions workflow
export async function triggerGitHubAction() {
  try {
    console.log('🔄 Triggering GitHub Action...');
    const response = await octokit.rest.repos.createDispatchEvent({
      owner: OWNER,
      repo: REPO,
      event_type: 'run-tests',
      client_payload: {
        time: new Date().toISOString()
      }
    });
    
    console.log('✅ GitHub Action triggered:', response.status === 204 ? 'Success' : 'Failed');
    return response.status === 204;
  } catch (error) {
    console.error('❌ Error triggering GitHub Action:', error.message);
    throw error;
  }
}

// Add function to check workflow status (optional)
export async function getWorkflowStatus() {
  try {
    const { data } = await octokit.actions.listWorkflowRuns({
      owner: OWNER,
      repo: REPO,
      workflow_id: 'playwright.yml'
    });
    
    return data.workflow_runs[0]?.status || 'unknown';
  } catch (error) {
    console.error('❌ Error checking workflow status:', error.message);
    throw error;
  }
}
