import { useState } from "react";
import axios from "axios";

function App() {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState("");
  const [reportUrl, setReportUrl] = useState(null);

  const fetchTestCases = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/test-cases");
      setTestCases(res.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar test cases");
    }
    setLoading(false);
  };

  const generateTests = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/generate-tests-from-cases");
      console.log("Testes gerados:", res.data);
      alert("Testes Playwright gerados com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar testes");
    }
    setLoading(false);
  };

  const saveGeneratedTests = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/save-generated-tests");
      alert(`${res.data.count} ficheiros de teste guardados`);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar ficheiros de teste");
    }
    setLoading(false);
  };

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/run-playwright-tests");
      setLogs(res.data.stdout || "");
      setReportUrl("/api/playwright-report"); // endpoint do backend que serve o HTML
    } catch (err) {
      console.error(err);
      alert("Erro ao executar testes");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>QA AI Dashboard</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={fetchTestCases} disabled={loading}>📥 Buscar Test Cases</button>
        <button onClick={generateTests} disabled={loading}>⚙️ Gerar Testes</button>
        <button onClick={saveGeneratedTests} disabled={loading}>💾 Salvar Testes</button>
        <button onClick={runTests} disabled={loading}>▶️ Executar Testes</button>
      </div>

      {loading && <p>⏳ A processar...</p>}

      {testCases.length > 0 && (
        <div>
          <h2>Test Cases</h2>
          <ul>
            {testCases.map((tc, i) => (
              <li key={i}>
                <strong>{tc.title}</strong> - <a href={tc.url} target="_blank" rel="noreferrer">Ver Issue</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {logs && (
        <div style={{ marginTop: "20px" }}>
          <h2>Logs de Execução</h2>
          <pre style={{ backgroundColor: "#eee", padding: "10px" }}>{logs}</pre>
        </div>
      )}

      {reportUrl && (
        <div style={{ marginTop: "20px" }}>
          <h2>Relatório Playwright</h2>
          <iframe
            src={reportUrl}
            title="Relatório Playwright"
            width="100%"
            height="600px"
          />
        </div>
      )}
    </div>
  );
}

export default App;
