// usePlans.ts
//
// Custom hook that bridges frontend filter state → backend API.
//
// The flow:
//   1. User interacts with sidebar filters (slider, checkboxes, dropdown)
//   2. React state updates in the parent page component
//   3. This hook watches those state values via the `filters` param
//   4. On change, it builds a query string and fetches /api/plans
//   5. Returns { data, pagination, isLoading, error } for the table
//
// This pattern keeps the URL as the source of truth for API params
// and makes the component tree purely reactive.

import { useState, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────

export interface PlanFilters {
  accountSizeMin?: number;
  accountSizeMax?: number;
  drawdownType?: string[];         // ["trailing", "static"]
  platform?: string;               // "NinjaTrader"
  search?: string;                 // global search text
  sort?: string;                   // column key
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
  is_one_time: boolean;
  payout_frequency: string;
  first_payout_days: number | null;
  total_cost_to_funded: number;
  active_discount_pct: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface PlansResponse {
  data: PlanRow[];
  pagination: Pagination;
}

// ── Hook ───────────────────────────────────────────────────

export function usePlans(filters: PlanFilters) {
  const [data, setData]       = useState<PlanRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query string from filters — only include non-empty values
      const params = new URLSearchParams();

      if (filters.accountSizeMin) params.set("accountSizeMin", String(filters.accountSizeMin));
      if (filters.accountSizeMax) params.set("accountSizeMax", String(filters.accountSizeMax));
      if (filters.drawdownType?.length) params.set("drawdownType", filters.drawdownType.join(","));
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.search) params.set("search", filters.search);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.order) params.set("order", filters.order);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const url = `/api/plans?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const json: PlansResponse = await res.json();
      setData(json.data);
      setPagination(json.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to fetch plans");
    } finally {
      setIsLoading(false);
    }
  }, [
    // Serialize filter fields individually so we only refetch when
    // a filter value actually changes (not on every render).
    filters.accountSizeMin,
    filters.accountSizeMax,
    filters.drawdownType?.join(","),
    filters.platform,
    filters.search,
    filters.sort,
    filters.order,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, pagination, isLoading, error, refetch: fetchData };
}
