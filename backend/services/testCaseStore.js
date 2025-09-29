// backend/services/testCaseStore.js
let testCases = [];

export function setTestCases(cases) {
  testCases = cases;
}

export function getTestCases() {
  return testCases;
}