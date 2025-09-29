import fs from "fs/promises"
import path from "path"
import axios from "axios"

import dotenv from "dotenv";
dotenv.config();

const GITHUB_API = "https://api.github.com"
const OWNER = process.env.GITHUB_OWNER ||  "angelaantunes" // ex: "angelaantunes"
const REPO = process.env.GITHUB_REPO_NAME || "devqa-ai" // ex: "devqa-ai"
const TOKEN = process.env.GITHUB_TOKEN // Guarde o token em variável de ambiente

export async function uploadAllGeneratedTestsToGitHub() {
  const testsDir = path.join(process.cwd(), "tests", "generated")
  const files = await fs.readdir(testsDir)
  const results = []

  for (const file of files) {
    const localPath = path.join(testsDir, file)
    const repoPath = `tests/generated/${file}`
    const content = await fs.readFile(localPath, "utf-8")
    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${repoPath}`
    const headers = { Authorization: `token ${TOKEN}` }
    let sha
    try {
      const res = await axios.get(url, { headers })
      sha = res.data.sha
    } catch {}
    const res = await axios.put(url, {
      message: `Add generated Playwright test: ${file}`,
      content: Buffer.from(content).toString("base64"),
      sha
    }, { headers })
    results.push({ file, url: res.data.content.html_url })
  }

  return results // [{ file, url }]
}

export async function uploadTestFileToGitHub(localPath, repoPath, commitMessage) {
  const content = await fs.readFile(localPath, "utf-8")
  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${repoPath}`
  const headers = { Authorization: `token ${TOKEN}` }
  // Verifique se o ficheiro já existe para obter o sha
  let sha
  try {
    const res = await axios.get(url, { headers })
    sha = res.data.sha
  } catch {}
  // Crie ou atualize o ficheiro
  return axios.put(url, {
    message: commitMessage,
    content: Buffer.from(content).toString("base64"),
    sha
  }, { headers })
}