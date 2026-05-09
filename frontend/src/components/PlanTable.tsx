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

  // 2. Account Type
  columnHelper.accessor("account_type", {
    header: "Type",
    cell: (info) => {
      const v = info.getValue() || "Standard";
      const colorMap: Record<string, string> = {
        Standard: "bg-gray-500/20 text-gray-300",
        "No Activation": "bg-rose-500/20 text-rose-300",
        "No Scaling": "bg-lime-500/20 text-lime-300",
        EOD: "bg-cyan-500/20 text-cyan-300",
        "EOD Drawdown": "bg-cyan-500/20 text-cyan-300",
        Flex: "bg-sky-500/20 text-sky-300",
        Rapid: "bg-orange-500/20 text-orange-300",
        Builder: "bg-amber-600/20 text-amber-300",
        Pro: "bg-indigo-500/20 text-indigo-300",
        Growth: "bg-emerald-500/20 text-emerald-300",
        Select: "bg-violet-500/20 text-violet-300",
        Intraday: "bg-amber-500/20 text-amber-300",
        "1-Step Monthly": "bg-red-500/20 text-red-300",
        "Fast Track": "bg-pink-500/20 text-pink-300",
        Static: "bg-teal-500/20 text-teal-300",
        "Direct to Funded": "bg-yellow-500/20 text-yellow-300",
        "Diamond Hands": "bg-fuchsia-500/20 text-fuchsia-300",
      };
      const cls = colorMap[v] ?? "bg-gray-500/20 text-gray-300";
      return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
          {v}
        </span>
      );
    },
    size: 110,
  }),

  // 3. Eval Cost
  columnHelper.accessor("eval_fee", {
    header: "Eval Cost",
    cell: (info) => {
      const evalFee = info.getValue();
      const retailFee = info.row.original.retail_eval_fee;
      const priceStatus = info.row.original.price_status;
      const priceVerified = info.row.original.price_verified;

      // If retail price is higher than eval fee, the scraped price was a promo
      if (retailFee && retailFee > evalFee) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 line-through">{formatUSD(retailFee)}</span>
            <span className="text-green-400 font-medium">{formatUSD(evalFee)}</span>
            {priceStatus === 'promo_price_detected' && (
              <span className="inline-block self-start rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                Promo
              </span>
            )}
          </div>
        );
      }

      // Show verified checkmark for confirmed retail prices
      if (priceVerified === 1) {
        return (
          <div className="flex items-center gap-1">
            <span>{formatUSD(evalFee)}</span>
            <span className="text-emerald-400 text-xs" title="Verified retail price">✓</span>
          </div>
        );
      }

      return formatUSD(evalFee);
    },
    size: 100,
  }),

  // 3. Funded Setup Fee (activation_fee)
  columnHelper.accessor("activation_fee", {
    header: "Setup Fee",
    cell: (info) => {
      const v = info.getValue();
      return v > 0 ? formatUSD(v) : <span className="text-emerald-400">Free</span>;
    },
    size: 120,
  }),

  // 4. After Discount (eval fee with discount applied, or full price if no discount)
  columnHelper.accessor("eval_fee", {
    header: "After Discount",
    cell: (info) => {
      const evalFee = info.getValue();
      const pct = info.row.original.active_discount_pct;
      if (pct > 0) {
        const discounted = evalFee * (1 - pct / 100);
        return (
          <span className="text-green-400 font-medium">
            {formatUSD(discounted)} <span className="text-xs text-green-400/70">(-{pct}%)</span>
          </span>
        );
      }
      return <span className="text-gray-300">{formatUSD(evalFee)}</span>;
    },
    size: 120,
  }),

  // 5. Total = Setup Fee + After Discount
  columnHelper.accessor("eval_fee", {
    header: "Total",
    cell: (info) => {
      const evalFee = info.getValue();
      const act = info.row.original.activation_fee;
      const pct = info.row.original.active_discount_pct;
      const afterDiscount = pct > 0 ? evalFee * (1 - pct / 100) : evalFee;
      const total = act + afterDiscount;
      if (pct > 0) {
        return (
          <span className="font-bold text-brand-300">
            {formatUSD(total)} <span className="text-xs text-brand-300/70">(-{pct}%)</span>
          </span>
        );
      }
      return <span className="font-bold text-brand-300">{formatUSD(total)}</span>;
    },
    size: 100,
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

  // 10. Consistency Eval (percentage)
  columnHelper.accessor("consistency_eval", {
    header: "ConsEval",
    cell: (info) => {
      const v = info.getValue();
      if (v != null && v > 0) return <span className="text-gray-300">{v}%</span>;
      return <span className="text-gray-500">—</span>;
    },
    size: 120,
  }),

  // 11. Consistency Funded (percentage)
  columnHelper.accessor("consistency_funded", {
    header: "ConsFunded",
    cell: (info) => {
      const v = info.getValue();
      if (v != null && v > 0) return <span className="text-gray-300">{v}%</span>;
      return <span className="text-gray-500">—</span>;
    },
    size: 130,
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
