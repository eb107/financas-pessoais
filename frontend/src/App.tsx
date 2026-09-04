import { useEffect, useState } from "react";
import { API_URL } from "./lib/http";

type HealthStatus = "loading" | "ok" | "error";

function App() {
  const [status, setStatus] = useState<HealthStatus>("loading");

  useEffect(() => {
    fetch(`${API_URL}/api/health/`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-blue-600">Finanças Pessoais</h1>
      <p className="text-lg">
        Backend:{" "}
        {status === "loading" && (
          <span className="text-gray-500">verificando...</span>
        )}
        {status === "ok" && (
          <span className="font-semibold text-green-600">conectado ✓</span>
        )}
        {status === "error" && (
          <span className="font-semibold text-red-600">
            não foi possível conectar
          </span>
        )}
      </p>
    </div>
  );
}

export default App;
