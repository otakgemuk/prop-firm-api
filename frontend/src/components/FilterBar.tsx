// FilterBar.tsx
//
// Horizontal pill-button filter bar replacing the old sidebar.
// Filters: Account Size, Drawdown Type, Platform, Sort by

import {
  ACCOUNT_SIZES,
  DRAWDOWN_OPTIONS,
  PLATFORM_OPTIONS,
  SORT_OPTIONS,
} from "../lib/utils";

interface FilterBarProps {
  selectedSize: number;
  onSizeChange: (size: number) => void;

  selectedDrawdowns: string[];
  onDrawdownChange: (types: string[]) => void;

  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;

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

export default function FilterBar({
  selectedSize,
  onSizeChange,
  selectedDrawdowns,
  onDrawdownChange,
  selectedPlatform,
  onPlatformChange,
  sortValue,
  onSortChange,
}: FilterBarProps) {
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

      {/* Row 2: Platform + Sort */}
      <div className="flex flex-wrap items-center gap-6">
        <PillGroup
          label="Platform"
          options={[{ value: "", label: "All" }, ...PLATFORM_OPTIONS.map((p) => ({ value: p, label: p }))]}
          value={selectedPlatform}
          onChange={onPlatformChange}
        />

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
