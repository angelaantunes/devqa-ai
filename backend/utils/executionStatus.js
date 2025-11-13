// utils/executionStatus.js
const executionStatus = {}; // Exemplo: { filename: { status, reportUrl, runUrl, conclusion } }

export function setPending(testName) {
  executionStatus[testName] = { status: "pending" };
}
export function setCompleted(testName, data) {
  executionStatus[testName] = { ...data, status: "completed" };
}
export function getStatus(testName) {
  return executionStatus[testName] || null;
}
