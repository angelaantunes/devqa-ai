import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = "angelaantunes";  // Coloca teu user org do GitHub
const REPO = "devqa-ai";

export async function fetchGitHubIssues() {
  const { data } = await octokit.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    state: "open",
    labels: "test-case", // Opcional: filtra por label
  });

  // Mapeia issues para formato simplificado
  return data.map(issue => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    url: issue.html_url,
  }));
}
