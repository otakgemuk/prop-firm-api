// App.tsx — Main page component
//
// All data comes from the local data/plans.json file via the usePlans hook.
// Filtering, sorting, and pagination are handled entirely client-side.
// No backend required — just edit data/plans.json and rebuild.

import { useState, useCallback } from "react";
import type { SortingState } from "@tanstack/react-table";
import FilterBar from "./components/FilterBar";
import PlanTable from "./components/PlanTable";
import ComparisonCard from "./components/ComparisonCard";
import { usePlans, type PlanFilters } from "./hooks/usePlans";

type ViewMode = "table" | "cards";

export default function App() {
  // ── Filter state (source of truth) ─────────────────────
  const [accountSize, setAccountSize]   = useState(0);
  const [accountTypes, setAccountTypes] = useState<string[]>([]);
  const [drawdowns, setDrawdowns]       = useState<string[]>([]);
  const [firmIds, setFirmIds]           = useState<string[]>([]);
  const [search, setSearch]             = useState("");
  const [sortValue, setSortValue]       = useState("total_cost:asc");
  const [page, setPage]                 = useState(1);
  const [viewMode, setViewMode]         = useState<ViewMode>("table");

  // Parse sort value "field:order"
  const [sort, order] = sortValue.split(":") as [string, "asc" | "desc"];

  const filters: PlanFilters = {
    accountSize:  accountSize || undefined,
    accountType:  accountTypes.length ? accountTypes : undefined,
    drawdownType: drawdowns.length ? drawdowns : undefined,
    firmIds:      firmIds.length ? firmIds : undefined,
    search:       search || undefined,
    sort,
    order,
    page,
    limit: 100,
  };

  const { data, pagination, isLoading, error, firms } = usePlans(filters);

  // ── Export to Markdown ─────────────────────────────────
  const exportMarkdown = useCallback(() => {
    // Group by firm
    const grouped: Record<string, typeof data> = {};
    data.forEach((p) => {
      const key = p.firm_name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    let md = `# Prop Firm Plans\n\n`;
    md += `> Exported ${new Date().toISOString().slice(0, 10)} · ${data.length} plans\n\n`;

    Object.entries(grouped).forEach(([firm, plans]) => {
      md += `## ${firm}\n\n`;
      md += `| Plan | Account Size | Drawdown Type | Drawdown | Profit Target | Eval Fee | Activation Fee | Discount | Total Cost |\n`;
      md += `|------|-------------|---------------|----------|--------------|----------|----------------|----------|------------|\n`;
      plans.forEach((p) => {
        const dd = p.drawdown_amount ? `$${p.drawdown_amount.toLocaleString()}` : "—";
        const pt = p.profit_target ? `$${p.profit_target.toLocaleString()}` : "None";
        const disc = p.active_discount_pct > 0 ? `${p.active_discount_pct}%` : "—";
        md += `| ${p.account_type || p.plan_label} | ${p.plan_label} | ${p.drawdown_type || "—"} | ${dd} | ${pt} | $${p.eval_fee.toLocaleString()} | $${p.activation_fee.toLocaleString()} | ${disc} | $${p.total_cost_to_funded.toLocaleString()} |\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prop-firm-plans-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  // ── Sync table column sorting → filter state ───────────
  const handleSortingChange = useCallback((sorting: SortingState) => {
    if (sorting.length > 0) {
      setSortValue(`${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`);
    } else {
      setSortValue("total_cost:asc");
    }
    setPage(1);
  }, []);

  return (
    <div className="min-h-full bg-gray-950 text-gray-100">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Ox logo */}
            <img src="/MightyOx_Logo_Gold.webp" alt="MightyOx" className="h-10 w-10 rounded-lg object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Mighty<span className="text-brand-400">Ox</span> Trading
              </h1>
              <p className="text-sm text-gray-400">
                Find the best futures prop firm for your trading style
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search firms…"
                className="w-48 rounded-full border border-white/10 bg-gray-800/80 py-1.5 pl-9 pr-3
                           text-sm text-white placeholder-gray-500 focus:border-brand-400
                           focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>

            {/* View toggle */}
            <div className="flex rounded-full border border-white/10 p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === "table"
                    ? "bg-brand-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  viewMode === "cards"
                    ? "bg-brand-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Cards
              </button>
            </div>

            {/* Export MD */}
            <button
              onClick={exportMarkdown}
              className="rounded-full border border-white/10 bg-gray-800/80 px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:border-brand-400 hover:text-white"
              title="Export as Markdown"
            >
              ⬇ Export MD
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">

        {/* Filter bar */}
        <FilterBar
          selectedSize={accountSize}
          onSizeChange={(s) => { setAccountSize(s); setPage(1); }}
          selectedAccountTypes={accountTypes}
          onAccountTypeChange={(types) => { setAccountTypes(types); setPage(1); }}
          selectedDrawdowns={drawdowns}
          onDrawdownChange={(types) => { setDrawdowns(types); setPage(1); }}
          selectedFirms={firmIds}
          onFirmChange={(ids) => { setFirmIds(ids); setPage(1); }}
          firms={firms}
          sortValue={sortValue}
          onSortChange={(sv) => { setSortValue(sv); setPage(1); }}
        />

        {/* Status bar */}
        <div className="flex items-center justify-between text-sm text-gray-400">
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
          <div className="flex items-center justify-center gap-2">
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
      </main>
    </div>
  );
}
