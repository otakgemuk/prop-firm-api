// App.tsx — Main page component
//
// All data comes from the local data/plans.json file via the usePlans hook.
// Filtering, sorting, and pagination are handled entirely client-side.
// No backend required — just edit data/plans.json and rebuild.

import { useState, useCallback } from "react";
import type { SortingState } from "@tanstack/react-table";
import Sidebar from "./components/Sidebar";
import PlanTable from "./components/PlanTable";
import ComparisonCard from "./components/ComparisonCard";
import { usePlans, type PlanFilters } from "./hooks/usePlans";

type ViewMode = "table" | "cards";

export default function App() {
  // ── Filter state (source of truth) ─────────────────────
  const [accountSizeMin, setAccountSizeMin] = useState(0);
  const [accountSizeMax, setAccountSizeMax] = useState(300_000);
  const [drawdowns, setDrawdowns]           = useState<string[]>([]);
  const [platform, setPlatform]             = useState("");
  const [search, setSearch]                 = useState("");
  const [sort, setSort]                     = useState<string>("total_cost");
  const [order, setOrder]                   = useState<"asc" | "desc">("asc");
  const [page, setPage]                     = useState(1);
  const [viewMode, setViewMode]             = useState<ViewMode>("table");

  const filters: PlanFilters = {
    accountSizeMin: accountSizeMin || undefined,
    accountSizeMax: accountSizeMax < 300_000 ? accountSizeMax : undefined,
    drawdownType:   drawdowns.length ? drawdowns : undefined,
    platform:       platform || undefined,
    search:         search || undefined,
    sort,
    order,
    page,
    limit: 100,
  };

  const { data, pagination, isLoading, error } = usePlans(filters);

  // ── Sync table column sorting → filter state ───────────
  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (sorting.length > 0) {
      setSort(sorting[0].id);
      setOrder(sorting[0].desc ? "desc" : "asc");
    } else {
      setSort("total_cost");
      setOrder("asc");
    }
    setPage(1);
  }, []);

  return (
    <div className="min-h-full bg-gray-950 text-gray-100">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="./logo.png" alt="MightyOx Trading" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Mighty<span className="text-brand-400">Ox</span> Trading
              </h1>
              <p className="text-sm text-gray-400">
                Find the best futures prop firm for your trading style
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "table"
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                viewMode === "cards"
                  ? "bg-brand-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </header>

      {/* ── Main layout: sidebar + content ──────────────────── */}
      <main className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar */}
        <div className="sticky top-6 hidden w-72 shrink-0 lg:block">
          <Sidebar
            accountSizeMin={accountSizeMin}
            accountSizeMax={accountSizeMax}
            onAccountSizeChange={(min, max) => {
              setAccountSizeMin(min);
              setAccountSizeMax(max);
              setPage(1);
            }}
            selectedDrawdowns={drawdowns}
            onDrawdownChange={(types) => { setDrawdowns(types); setPage(1); }}
            selectedPlatform={platform}
            onPlatformChange={(p) => { setPlatform(p); setPage(1); }}
            search={search}
            onSearchChange={(s) => { setSearch(s); setPage(1); }}
          />
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {/* Status bar */}
          <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
            {isLoading ? (
              <span>Loading plans…</span>
            ) : error ? (
              <span className="text-red-400">Error: {error}</span>
            ) : (
              <span>
                Showing <strong className="text-white">{data.length}</strong> of{" "}
                <strong className="text-white">{pagination.total}</strong> plans
              </span>
            )}
          </div>

          {/* Table or Card view */}
          {viewMode === "table" ? (
            <PlanTable
              data={data}
              onSortingChange={handleSortingChange}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((plan) => (
                <ComparisonCard key={plan.plan_id} plan={plan} />
              ))}
              {data.length === 0 && !isLoading && (
                <p className="col-span-full py-12 text-center text-gray-500">
                  No plans match your filters.
                </p>
              )}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300
                           transition hover:border-brand-400 disabled:opacity-30"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300
                           transition hover:border-brand-400 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
