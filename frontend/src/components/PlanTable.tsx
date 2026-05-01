// PlanTable.tsx
//
// The core comparison engine powered by TanStack Table (react-table v8).

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState } from "react";
import type { PlanRow } from "../hooks/usePlans";
import { formatUSD, DRAWDOWN_STYLES } from "../lib/utils";

// ── Column definitions ─────────────────────────────────────

const columnHelper = createColumnHelper<PlanRow>();

const columns: ColumnDef<PlanRow, any>[] = [
  // 1. Firm
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

  // 2. Eval Cost
  columnHelper.accessor("eval_fee", {
    header: "Eval Cost",
    cell: (info) => formatUSD(info.getValue()),
    size: 100,
  }),

  // 3. Funded Setup Fee (activation_fee)
  columnHelper.accessor("activation_fee", {
    header: "Funded Setup Fee",
    cell: (info) => {
      const v = info.getValue();
      return v > 0 ? formatUSD(v) : <span className="text-emerald-400">Free</span>;
    },
    size: 120,
  }),

  // 4. Total (total cost to funded)
  columnHelper.accessor("total_cost_to_funded", {
    header: "Total",
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
    size: 110,
  }),

  // 5. Max # Funded Accounts
  columnHelper.accessor("max_funded_accounts", {
    header: "Max # Funded",
    cell: (info) => {
      const v = info.getValue();
      return <span className="text-gray-300">{v ? v.toLocaleString() : "—"}</span>;
    },
    size: 120,
  }),

  // 6. DD Type (drawdown_type)
  columnHelper.accessor("drawdown_type", {
    header: "DD Type",
    cell: (info) => {
      const badge = DRAWDOWN_STYLES[info.getValue()] ?? { label: info.getValue(), color: "bg-gray-500/20 text-gray-300" };
      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
          {badge.label}
        </span>
      );
    },
    size: 100,
  }),

  // 7. Target (profit_target)
  columnHelper.accessor("profit_target", {
    header: "Target",
    cell: (info) => formatUSD(info.getValue()),
    size: 90,
  }),

  // 8. Max DD (drawdown_amount)
  columnHelper.accessor("drawdown_amount", {
    header: "Max DD",
    cell: (info) => formatUSD(info.getValue()),
    size: 90,
  }),

  // 9. Min Trading Days
  columnHelper.accessor("min_trading_days", {
    header: "Min Days",
    cell: (info) => {
      const v = info.getValue();
      return <span className="text-gray-300">{v ? v : "—"}</span>;
    },
    size: 90,
  }),

  // 10. Consistency Eval
  columnHelper.accessor("consistency_eval", {
    header: "Consistency Eval",
    cell: (info) => {
      const v = info.getValue();
      if (v === true || v === 1) return <span className="text-emerald-400">✓</span>;
      if (v === false || v === 0) return <span className="text-gray-500">✗</span>;
      return <span className="text-gray-500">—</span>;
    },
    size: 120,
  }),

  // 11. Consistency Funded
  columnHelper.accessor("consistency_funded", {
    header: "Consistency Funded",
    cell: (info) => {
      const v = info.getValue();
      if (v === true || v === 1) return <span className="text-emerald-400">✓</span>;
      if (v === false || v === 0) return <span className="text-gray-500">✗</span>;
      return <span className="text-gray-500">—</span>;
    },
    size: 130,
  }),

  // Buy Now action
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
    size: 90,
  }),
];

// ── Component ──────────────────────────────────────────────

interface PlanTableProps {
  data: PlanRow[];
  onSortingChange?: (sorting: SortingState) => void;
  serverSorting?: SortingState;
}

export default function PlanTable({ data, onSortingChange, serverSorting }: PlanTableProps) {
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
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-gray-900/60">
      <table className="w-full text-sm">
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
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

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
