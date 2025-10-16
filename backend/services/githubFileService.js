import fs from "fs/promises";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GITHUB_API = "https://api.github.com";
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO_NAME;
const TOKEN = process.env.GITHUB_TOKEN;

if (!OWNER || !REPO || !TOKEN) {
  console.warn("⚠️ Missing GitHub credentials in .env");
}

// 🔹 Upload de todos os ficheiros gerados
export async function uploadAllGeneratedTestsToGitHub() {
  const testsDir = path.join(process.cwd(), "tests", "generated");
  const files = await fs.readdir(testsDir);
  const results = [];

  for (const file of files) {
    const localPath = path.join(testsDir, file);
    const repoPath = `tests/generated/${file}`;
    const content = await fs.readFile(localPath, "utf-8");
    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${repoPath}`;
    const headers = { Authorization: `token ${TOKEN}` };

    let sha;
    try {
      const res = await axios.get(url, { headers });
      sha = res.data.sha;
    } catch {
      // ficheiro ainda não existe → ignora
    }

    try {
      const res = await axios.put(
        url,
        {
          message: `🧪 Add generated Playwright test: ${file}`,
          content: Buffer.from(content).toString("base64"),
          sha,
        },
        { headers }
      );

      /*results.push({
        file,
        url: res.data.content.html_url,
      });*/
      const url = await uploadTestFileToGitHub(localPath, repoPath, commitMessage);
results.push({ file, url });
      console.log(`✅ Uploaded: ${file}`);
    } catch (err) {
      console.error(`❌ Falha ao enviar ${file}:`, err.response?.data || err.message);
      results.push({ file, error: err.message });
    }
  }

  return results;
}

// 🔹 Upload de um único ficheiro (usado no save individual)
export async function uploadTestFileToGitHub(localPath, repoPath, commitMessage) {
  try {
    const content = await fs.readFile(localPath, "utf-8");
    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${repoPath}`;
    const headers = {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    };

    let sha = undefined;
    try {
      const existing = await axios.get(url, { headers });
      sha = existing.data.sha;
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("❌ Erro ao verificar ficheiro existente:", err.response?.data || err.message);
        throw err;
      }
    }

    const body = {
      message: commitMessage,
      content: Buffer.from(content).toString("base64"),
      sha,
    };

    const res = await axios.put(url, body, { headers });

    // 🧭 Fallbacks seguros para URL do ficheiro no GitHub
    const htmlUrl =
      res.data?.content?.html_url ||
      res.data?.commit?.html_url ||
      `https://github.com/${OWNER}/${REPO}/blob/main/${repoPath}`;

    console.log(`✅ Upload concluído: ${htmlUrl}`);
    //return htmlUrl;
    return res.data;
  } catch (err) {
    console.error("❌ Falha no upload para GitHub:", err.response?.data || err.message);
    throw err;
  }
}