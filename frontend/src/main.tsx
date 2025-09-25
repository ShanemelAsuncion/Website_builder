
  import { createRoot } from "react-dom/client";
  import App from "./App";
  import "./index.css";
  import "./tw-utilities.css";
  import { loadConfig } from "./services/runtimeConfig";
  import { setApiBaseUrl } from "./services/api";

  (async () => {
    try {
      const cfg = await loadConfig();
      if (cfg?.API_BASE_URL) setApiBaseUrl(cfg.API_BASE_URL);
    } catch {}
    createRoot(document.getElementById("root")!).render(<App />);
  })();
  