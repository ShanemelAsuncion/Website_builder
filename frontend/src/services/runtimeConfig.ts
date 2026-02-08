export type RuntimeConfig = {
  API_BASE_URL: string;
  BACKEND_ORIGIN?: string;
  USER_EMAIL?: string;
  SITE_NAME?: string;
};

let config: RuntimeConfig | null = null;

const defaultConfig: RuntimeConfig = {
  API_BASE_URL: 'http://localhost:5000/api',
};

// Fetch helper with timeout
async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(to);
  }
}

export async function loadConfig(): Promise<RuntimeConfig> {
  if (config) return config;

  // 1) Load from public config.json
  let publicCfg: Partial<RuntimeConfig> = {};
  try {
    const res = await fetchWithTimeout('/config.json', undefined, 5000);
    if (res.ok) publicCfg = await res.json();
  } catch {}

  // Merge with defaults
  const merged: RuntimeConfig = {
    ...defaultConfig,
    ...publicCfg,
  } as RuntimeConfig;

  // 2) Attempt to load live config from backend /api/config
  try {
    const apiBase = merged.API_BASE_URL?.replace(/\/$/, '') || defaultConfig.API_BASE_URL;
    const backendOrigin = apiBase.replace(/\/?api\/?$/, '');
    const res = await fetchWithTimeout(`${backendOrigin}/api/config`, undefined, 5000);
    if (res.ok) {
      const serverCfg = (await res.json()) as Partial<RuntimeConfig>;
      Object.assign(merged, serverCfg);
    }
  } catch {}

  // 2b) Fallback: try current origin if configured backend is unreachable
  try {
    const currentOrigin = window.location.origin;
    const res2 = await fetchWithTimeout(`${currentOrigin.replace(/\/$/, '')}/api/config`, undefined, 4000);
    if (res2.ok) {
      const serverCfg2 = (await res2.json()) as Partial<RuntimeConfig>;
      Object.assign(merged, serverCfg2);
    }
  } catch {}

  // Finalize
  config = merged;
  // Persist for debugging/troubleshooting
  try { (window as any).__RUNTIME_CONFIG__ = merged; } catch {}
  return merged;
}

export function getConfig(): RuntimeConfig {
  if (!config) return defaultConfig;
  return config;
}
