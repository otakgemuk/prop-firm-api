// usePlans.ts
//
// Client-side data hook — loads plans from local data/plans.json
// and handles all filtering, sorting, and pagination in the browser.
//
// No backend needed. The JSON file is the single source of truth.

import { useState, useEffect, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────

export interface PlanFilters {
  accountSize?: number;
  drawdownType?: string[];
  platform?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PlanRow {
  firm_id: string;
  firm_name: string;
  firm_slug: string;
  logo_url: string | null;
  website_url: string;
  trustpilot: number;
  plan_id: string;
  account_size: number;
  plan_label: string;
  drawdown_type: string;
  drawdown_amount: number;
  daily_loss_limit: number;
  profit_target: number;
  profit_split: number;
  eval_fee: number;
  activation_fee: number;
  monthly_fee: number;
  is_one_time: number;
  payout_frequency: string;
  first_payout_days: number | null;
  total_cost_to_funded: number;
  active_discount_pct: number;
}


// ── Sort key mapping ───────────────────────────────────────

const SORT_KEYS: Record<string, (row: PlanRow) => number | string> = {
  firm_name:         (r) => r.firm_name.toLowerCase(),
  account_size:      (r) => r.account_size,
  drawdown_type:     (r) => r.drawdown_type,
  drawdown_amount:   (r) => r.drawdown_amount,
  daily_loss_limit:  (r) => r.daily_loss_limit,
  profit_target:     (r) => r.profit_target,
  eval_fee:          (r) => r.eval_fee,
  activation_fee:    (r) => r.activation_fee,
  total_cost:        (r) => r.total_cost_to_funded,
  total_cost_to_funded: (r) => r.total_cost_to_funded,
  profit_split:      (r) => r.profit_split,
  trustpilot:        (r) => r.trustpilot,
};

// ── Hook ───────────────────────────────────────────────────

export function usePlans(filters: PlanFilters) {
  const [allPlans, setAllPlans] = useState<PlanRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load JSON once on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch("./plans.json");
        if (!res.ok) throw new Error(`Failed to load plans.json: ${res.status}`);
        const json: PlanRow[] = await res.json();
        if (!cancelled) {
          setAllPlans(json);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load data");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Stable filter keys for memo dependency
  const drawdownKey = filters.drawdownType?.slice().sort().join(",") ?? "";

  // Apply filters → sort → paginate (all client-side)
  const { data, pagination } = useMemo(() => {
    let rows = [...allPlans];

    // ── Filter: account size (exact match when > 0) ────────
    if (filters.accountSize && filters.accountSize > 0) {
      rows = rows.filter((r) => r.account_size === filters.accountSize);
    }

    // ── Filter: drawdown types ─────────────────────────────
    if (filters.drawdownType?.length) {
      const set = new Set(filters.drawdownType);
      rows = rows.filter((r) => set.has(r.drawdown_type));
    }

    // ── Filter: global search ──────────────────────────────
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.firm_name.toLowerCase().includes(q) ||
          r.plan_label.toLowerCase().includes(q) ||
          r.firm_slug.toLowerCase().includes(q)
      );
    }

    // ── Sort ───────────────────────────────────────────────
    const sortKey = filters.sort || "total_cost";
    const sortFn = SORT_KEYS[sortKey] || SORT_KEYS.total_cost;
    const dir = filters.order === "desc" ? -1 : 1;

    rows.sort((a, b) => {
      const va = sortFn(a);
      const vb = sortFn(b);
      if (typeof va === "string" && typeof vb === "string") {
        return dir * va.localeCompare(vb);
      }
      return dir * ((va as number) - (vb as number));
    });

    // ── Paginate ───────────────────────────────────────────
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const data = rows.slice(offset, offset + limit);

    return {
      data,
      pagination: { page, limit, total, pages },
    };
  }, [
    allPlans,
    filters.accountSize,
    drawdownKey,
    filters.platform,
    filters.search,
    filters.sort,
    filters.order,
    filters.page,
    filters.limit,
  ]);

  return { data, pagination, isLoading, error };
}
