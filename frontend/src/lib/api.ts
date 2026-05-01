// api.ts — Shared API helpers
//
// Centralises fetch logic so components don't hardcode URLs.
// The Vite dev server proxies /api → Express (see vite.config.ts).
// In production, serve both from the same origin or configure a reverse proxy.

const BASE = "/api";

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

// Fetch distinct platform names for the sidebar dropdown
export async function fetchPlatforms(): Promise<string[]> {
  // We could add a dedicated endpoint, but for now we can extract
  // unique platforms from a broad plans query. Alternatively, add
  // GET /api/platforms to the backend.
  const res = await fetchJson<{ data: any[] }>("/plans?limit=200");
  const platforms = new Set<string>();
  // Platforms aren't in the plans response — this is a simplification.
  // In production, add GET /api/platforms that queries the platforms table.
  return ["NinjaTrader", "TradingView", "Rithmic", "CQG", "Tradovate", "QuantTower", "Volfix"];
}
