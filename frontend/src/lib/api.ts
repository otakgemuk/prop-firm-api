// api.ts — Shared API helpers
//
// Currently unused — all data comes from the local plans.json file.
// Kept for future use if a backend API is added back.

const BASE = "/api";

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}
