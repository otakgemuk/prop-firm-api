// Sidebar.tsx
//
// Filter sidebar for the comparison engine.
// All filter state is managed by the parent page and passed down as props.
// When the user changes a filter, the parent updates its state, which
// triggers the usePlans hook to refetch with new query params.
//
// Controls:
//   1. Account Size — dual-range slider (min / max)
//   2. Drawdown Type — checkboxes (multi-select)
//   3. Trading Platform — dropdown (single-select)
//   4. Search — text input (global search)

import { useState, useEffect } from "react";

interface SidebarProps {
  accountSizeMin: number;
  accountSizeMax: number;
  onAccountSizeChange: (min: number, max: number) => void;

  selectedDrawdowns: string[];
  onDrawdownChange: (types: string[]) => void;

  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;

  search: string;
  onSearchChange: (search: string) => void;
}

const DRAWDOWN_OPTIONS = [
  { value: "end_of_day", label: "EOD Trailing" },
  { value: "trailing",   label: "Trailing" },
  { value: "static",     label: "Static" },
  { value: "intraday",   label: "Intraday" },
];

const PLATFORM_OPTIONS = [
  "NinjaTrader",
  "TradingView",
  "Rithmic",
  "CQG",
  "Tradovate",
  "QuantTower",
  "Volfix",
];

export default function Sidebar({
  accountSizeMin,
  accountSizeMax,
  onAccountSizeChange,
  selectedDrawdowns,
  onDrawdownChange,
  selectedPlatform,
  onPlatformChange,
  search,
  onSearchChange,
}: SidebarProps) {
  // Local state for the slider — debounce before propagating to parent
  const [localMin, setLocalMin] = useState(accountSizeMin);
  const [localMax, setLocalMax] = useState(accountSizeMax);

  // Debounce slider values → parent (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onAccountSizeChange(localMin, localMax);
    }, 300);
    return () => clearTimeout(timer);
  }, [localMin, localMax]);

  const toggleDrawdown = (value: string) => {
    const next = selectedDrawdowns.includes(value)
      ? selectedDrawdowns.filter((d) => d !== value)
      : [...selectedDrawdowns, value];
    onDrawdownChange(next);
  };

  return (
    <aside className="space-y-6 rounded-2xl border border-white/10 bg-gray-900/60 p-5">

      {/* ── Search ─────────────────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">Search</label>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Firm or plan name…"
          className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm
                     text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none
                     focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {/* ── Account Size Slider ────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">
          Account Size
        </label>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>${(localMin / 1000).toFixed(0)}K</span>
          <span>${(localMax / 1000).toFixed(0)}K</span>
        </div>
        <div className="mt-2 space-y-3">
          <div>
            <span className="text-xs text-gray-500">Min</span>
            <input
              type="range"
              min={0}
              max={300000}
              step={5000}
              value={localMin}
              onChange={(e) => setLocalMin(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>
          <div>
            <span className="text-xs text-gray-500">Max</span>
            <input
              type="range"
              min={0}
              max={300000}
              step={5000}
              value={localMax}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>
        </div>
      </div>

      {/* ── Drawdown Type Checkboxes ───────────────────────── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">
          Drawdown Type
        </label>
        <div className="space-y-2">
          {DRAWDOWN_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-gray-300"
            >
              <input
                type="checkbox"
                checked={selectedDrawdowns.includes(opt.value)}
                onChange={() => toggleDrawdown(opt.value)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-500
                           focus:ring-brand-400 focus:ring-offset-gray-900"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Platform Dropdown ──────────────────────────────── */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-300">
          Trading Platform
        </label>
        <select
          value={selectedPlatform}
          onChange={(e) => onPlatformChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm
                     text-white focus:border-brand-400 focus:outline-none focus:ring-1
                     focus:ring-brand-400"
        >
          <option value="">All Platforms</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* ── Reset button ───────────────────────────────────── */}
      <button
        onClick={() => {
          setLocalMin(0);
          setLocalMax(300000);
          onDrawdownChange([]);
          onPlatformChange("");
          onSearchChange("");
        }}
        className="w-full rounded-lg border border-white/10 py-2 text-sm text-gray-400
                   transition hover:border-red-500/30 hover:text-red-300"
      >
        Reset Filters
      </button>
    </aside>
  );
}
