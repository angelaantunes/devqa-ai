import axios from "axios"
import dotenv from "dotenv"
dotenv.config()

const PRACTITEST_API = process.env.PRACTITEST_API // ex: https://api.practitest.com/api/v2/projects/16905
const TOKEN = process.env.PRACTITEST_TOKEN



function getHeaders() {
  console.log(process.env.PRACTITEST_TOKEN)
  return {
    "Authorization": `Bearer ${TOKEN}`,
    "Content-Type": "application/json"
  }
}

export async function createTestCase(title, description) {
  return axios.post(
    `${PRACTITEST_API}/tests.json`,
    {
      data: {
        type: "tests",
        attributes: {
          name: title,
          description: description
        }
      }
    },
    { headers: getHeaders() }
  )
}

export async function createTestRun(testId, status, comment) {
  return axios.post(
    `${PRACTITEST_API}/runs.json`,
    {
      data: {
        type: "runs",
        attributes: {
          test_id: testId,
          status: status, // "passed", "failed", etc.
          comment: comment
        }
      }
    },
    { headers: getHeaders() }
  )
}