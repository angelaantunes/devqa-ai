// backend/services/testCaseStore.js
let testCases = [];

export function setTestCases(cases) {
  testCases = cases;
}

export function getTestCases() {
  return testCases;
}

/*import fs from 'fs';
import path from 'path';

const filePath = path.resolve('generated_tests.json');

export function getTestCases() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Erro a ler generated_tests.json:", err);
    return [];
  }
}

export function setTestCases(cases) {
  fs.writeFileSync(filePath, JSON.stringify(cases, null, 2));
}
*/