// FilterBar.tsx
//
// Horizontal pill-button filter bar replacing the old sidebar.
// Filters: Account Size, Drawdown Type, Platform, Sort by

import {
  ACCOUNT_SIZES,
  ACCOUNT_TYPE_OPTIONS,
  DRAWDOWN_OPTIONS,
  PLATFORM_OPTIONS,
  SORT_OPTIONS,
} from "../lib/utils";
import { useState, useRef, useEffect } from "react";

interface FilterBarProps {
  selectedSize: number;
  onSizeChange: (size: number) => void;

  selectedAccountTypes: string[];
  onAccountTypeChange: (types: string[]) => void;

  selectedDrawdowns: string[];
  onDrawdownChange: (types: string[]) => void;

  selectedFirms: string[];
  onFirmChange: (firmIds: string[]) => void;
  firms: { id: string; name: string }[];

  sortValue: string;
  onSortChange: (sort: string) => void;
}

function PillGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition
                ${active
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FirmDropdown({
  firms,
  selected,
  onToggle,
  onClear,
}: {
  firms: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? firms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : firms;

  const label = selected.length === 0
    ? "All Firms"
    : selected.length === 1
      ? firms.find((f) => f.id === selected[0])?.name ?? "1 selected"
      : `${selected.length} firms`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
        Firm
      </span>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition
            ${selected.length > 0
              ? "border-brand-500/50 bg-brand-500/10 text-brand-300"
              : "border-white/10 bg-gray-800 text-gray-400 hover:border-white/20 hover:text-gray-200"
            }`}
        >
          {label}
          <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Search */}
            <div className="border-b border-white/10 p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search firms…"
                autoFocus
                className="w-full rounded-lg bg-gray-800 px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>

            {/* Clear */}
            {selected.length > 0 && (
              <button
                onClick={() => { onClear(); setSearch(""); }}
                className="w-full border-b border-white/10 px-3 py-2 text-left text-xs text-red-400 hover:bg-white/5"
              >
                ✕ Clear selection
              </button>
            )}

            {/* Firm list */}
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-500">No firms found</p>
              )}
              {filtered.map((firm) => {
                const active = selected.includes(firm.id);
                return (
                  <button
                    key={firm.id}
                    onClick={() => onToggle(firm.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-white/5
                      ${active ? "text-brand-300" : "text-gray-300"}`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded border
                      ${active ? "border-brand-500 bg-brand-500" : "border-gray-600 bg-gray-800"}`}
                    >
                      {active && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {firm.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FilterBar({
  selectedSize,
  onSizeChange,
  selectedAccountTypes,
  onAccountTypeChange,
  selectedDrawdowns,
  onDrawdownChange,
  selectedFirms,
  onFirmChange,
  firms,
  sortValue,
  onSortChange,
}: FilterBarProps) {
  // Account type and drawdown are multi-select
  const toggleAccountType = (value: string) => {
    if (value === "") {
      onAccountTypeChange([]);
      return;
    }
    const next = selectedAccountTypes.includes(value)
      ? selectedAccountTypes.filter((t) => t !== value)
      : [...selectedAccountTypes, value];
    onAccountTypeChange(next);
  };

  // Drawdown is multi-select, others are single-select
  const toggleDrawdown = (value: string) => {
    if (value === "") {
      onDrawdownChange([]);
      return;
    }
    const next = selectedDrawdowns.includes(value)
      ? selectedDrawdowns.filter((d) => d !== value)
      : [...selectedDrawdowns, value];
    onDrawdownChange(next);
  };

  // Firm is multi-select
  const toggleFirm = (value: string) => {
    const next = selectedFirms.includes(value)
      ? selectedFirms.filter((f) => f !== value)
      : [...selectedFirms, value];
    onFirmChange(next);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-gray-900/60 p-4">
      {/* Row 1: Account Size + Drawdown Type */}
      <div className="flex flex-wrap items-center gap-6">
        <PillGroup
          label="Account Size"
          options={ACCOUNT_SIZES.map((s) => ({ value: String(s.value), label: s.label }))}
          value={String(selectedSize)}
          onChange={(v) => onSizeChange(Number(v))}
        />

        <div className="h-5 w-px bg-white/10 hidden md:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
            Type
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onAccountTypeChange([])}
              className={`rounded-full px-3 py-1 text-xs font-medium transition
                ${selectedAccountTypes.length === 0
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
            >
              All
            </button>
            {ACCOUNT_TYPE_OPTIONS.map((opt) => {
              const active = selectedAccountTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleAccountType(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition
                    ${active
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 hidden md:block" />

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
            Drawdown
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => onDrawdownChange([])}
              className={`rounded-full px-3 py-1 text-xs font-medium transition
                ${selectedDrawdowns.length === 0
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
            >
              All
            </button>
            {DRAWDOWN_OPTIONS.map((opt) => {
              const active = selectedDrawdowns.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleDrawdown(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition
                    ${active
                      ? "bg-brand-500 text-white shadow-sm"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                    }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Firm dropdown + Platform + Sort */}
      <div className="flex flex-wrap items-center gap-6">
        <FirmDropdown
          firms={firms}
          selected={selectedFirms}
          onToggle={toggleFirm}
          onClear={() => onFirmChange([])}
        />

        <div className="h-5 w-px bg-white/10 hidden md:block" />

        {/* TODO: Platform filter — no plan data has platform field yet
        <PillGroup
          label="Platform"
          options={[{ value: "", label: "All" }, ...PLATFORM_OPTIONS.map((p) => ({ value: p, label: p }))]}
          value={selectedPlatform}
          onChange={onPlatformChange}
        />
        */}

        <div className="h-5 w-px bg-white/10 hidden md:block" />

        <PillGroup
          label="Sort by"
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}
