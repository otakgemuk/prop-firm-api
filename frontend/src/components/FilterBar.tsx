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
  selectedAccountTypes,
  onAccountTypeChange,
  selectedDrawdowns,
  onDrawdownChange,
  selectedFirms,
  onFirmChange,
  firms,
  selectedPlatform,
  onPlatformChange,
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
    if (value === "") {
      onFirmChange([]);
      return;
    }
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

      {/* Row 2: Firm filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 shrink-0">
          Firm
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onFirmChange([])}
            className={`rounded-full px-3 py-1 text-xs font-medium transition
              ${selectedFirms.length === 0
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              }`}
          >
            All
          </button>
          {firms.map((firm) => {
            const active = selectedFirms.includes(firm.id);
            return (
              <button
                key={firm.id}
                onClick={() => toggleFirm(firm.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition
                  ${active
                    ? "bg-brand-500 text-white shadow-sm"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                  }`}
              >
                {firm.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Platform + Sort */}
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
