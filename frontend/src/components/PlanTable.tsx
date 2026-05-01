// PlanTable.tsx
//
// The core comparison engine powered by TanStack Table (react-table v8).
//
// Features:
//   • Multi-column sorting (shift-click to add secondary sorts)
//   • Global text search (handled by sidebar → usePlans → API)
//   • Column-level formatting (currency, percentages, badges)
//   • Pagination controls
//   • Row click → opens firm website
//
// Architecture note:
//   TanStack Table operates CLIENT-SIDE on the current page of data.
//   Server-side sorting is handled by passing sort/order params to the API
//   via the usePlans hook. This keeps the table lightweight and the DB
//   doing the heavy lifting.

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import type { PlanRow } from "../hooks/usePlans";

// ── Helpers ────────────────────────────────────────────────

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const DRAWDOWN_BADGES: Record<string, { label: string; cls: string }> = {
  end_of_day: { label: "EOD",      cls: "bg-blue-500/20 text-blue-300" },
  trailing:   { label: "Trailing", cls: "bg-purple-500/20 text-purple-300" },
  static:     { label: "Static",   cls: "bg-emerald-500/20 text-emerald-300" },
  intraday:   { label: "Intraday", cls: "bg-amber-500/20 text-amber-300" },
};

// ── Column definitions ─────────────────────────────────────

const columnHelper = createColumnHelper<PlanRow>();

const columns: ColumnDef<PlanRow, any>[] = [
  columnHelper.accessor("firm_name", {
    header: "Firm",
    cell: (info) => (
      <div className="flex items-center gap-2">
        {info.row.original.logo_url ? (
          <img src={info.row.original.logo_url} alt="" className="h-6 w-6 rounded" />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-600/30
                          text-xs font-bold text-brand-300">
            {info.getValue().charAt(0)}
          </div>
        )}
        <span className="font-medium text-white">{info.getValue()}</span>
      </div>
    ),
    size: 160,
  }),

  columnHelper.accessor("account_size", {
    header: "Size",
    cell: (info) => (
      <span className="font-semibold text-white">
        {info.row.original.plan_label || formatUSD(info.getValue())}
      </span>
    ),
    size: 80,
  }),

  columnHelper.accessor("drawdown_type", {
    header: "Drawdown",
    cell: (info) => {
      const badge = DRAWDOWN_BADGES[info.getValue()] ?? { label: info.getValue(), cls: "bg-gray-500/20 text-gray-300" };
      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
          {badge.label}
        </span>
      );
    },
    size: 100,
  }),

  columnHelper.accessor("drawdown_amount", {
    header: "DD Amount",
    cell: (info) => formatUSD(info.getValue()),
    size: 100,
  }),

  columnHelper.accessor("daily_loss_limit", {
    header: "Daily Loss",
    cell: (info) => formatUSD(info.getValue()),
    size: 100,
  }),

  columnHelper.accessor("profit_target", {
    header: "Target",
    cell: (info) => formatUSD(info.getValue()),
    size: 100,
  }),

  columnHelper.accessor("eval_fee", {
    header: "Eval Fee",
    cell: (info) => formatUSD(info.getValue()),
    size: 100,
  }),

  columnHelper.accessor("activation_fee", {
    header: "Activation",
    cell: (info) => {
      const v = info.getValue();
      return v > 0 ? formatUSD(v) : <span className="text-emerald-400">Free</span>;
    },
    size: 100,
  }),

  columnHelper.accessor("total_cost_to_funded", {
    header: "Total Cost",
    cell: (info) => (
      <div>
        <span className="font-bold text-brand-300">{formatUSD(info.getValue())}</span>
        {info.row.original.active_discount_pct > 0 && (
          <span className="ml-1 text-xs text-green-400">
            (-{info.row.original.active_discount_pct}%)
          </span>
        )}
      </div>
    ),
    size: 120,
  }),

  columnHelper.accessor("profit_split", {
    header: "Split",
    cell: (info) => <span className="font-medium text-white">{info.getValue()}%</span>,
    size: 70,
  }),

  columnHelper.accessor("payout_frequency", {
    header: "Payout",
    cell: (info) => (
      <span className="capitalize text-gray-300">{info.getValue()}</span>
    ),
    size: 90,
  }),

  // "Buy Now" action column
  columnHelper.display({
    id: "action",
    header: "",
    cell: (info) => (
      <a
        href={info.row.original.website_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-block rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold
                   text-white transition hover:bg-brand-400"
      >
        Buy Now
      </a>
    ),
    size: 100,
  }),
];

// ── Component ──────────────────────────────────────────────

interface PlanTableProps {
  data: PlanRow[];
  onSortingChange?: (sorting: SortingState) => void;
  serverSorting?: SortingState;
}

export default function PlanTable({ data, onSortingChange, serverSorting }: PlanTableProps) {
  // TanStack Table's sorting state — synced up to parent for server-side sorting
  const [sorting, setSorting] = useState<SortingState>(serverSorting ?? []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      onSortingChange?.(next);
    },
    getCoreRowModel:    getCoreRowModel(),
    getSortedRowModel:  getSortedRowModel(),
    // We handle pagination server-side, so no client-side pagination model
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-gray-900/60">
      <table className="w-full text-sm">
        {/* ── Header ───────────────────────────────────────── */}
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-white/10">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ width: header.getSize() }}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                             text-gray-400 select-none"
                >
                  {header.isPlaceholder ? null : (
                    <div
                      className={`inline-flex items-center gap-1 ${
                        header.column.getCanSort() ? "cursor-pointer hover:text-white" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {/* Sort indicator */}
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* ── Body ─────────────────────────────────────────── */}
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/5 transition hover:bg-white/5"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}

          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-500">
                No plans match your filters. Try adjusting the criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
