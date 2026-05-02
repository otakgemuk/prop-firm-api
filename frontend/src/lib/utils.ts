// Shared utilities

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export interface DrawdownStyle {
  label: string;
  color: string;
}

export const DRAWDOWN_STYLES: Record<string, DrawdownStyle> = {
  end_of_day: { label: "EOD",      color: "bg-blue-500/20 text-blue-300" },
  trailing:   { label: "Trailing", color: "bg-purple-500/20 text-purple-300" },
  static:     { label: "Static",   color: "bg-emerald-500/20 text-emerald-300" },
  intraday:   { label: "Intraday", color: "bg-amber-500/20 text-amber-300" },
};

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "Standard",          label: "Standard" },
  { value: "No Activation",     label: "No Activation" },
  { value: "No Scaling",        label: "No Scaling" },
  { value: "EOD",               label: "EOD" },
  { value: "EOD Drawdown",      label: "EOD DD" },
  { value: "Flex",              label: "Flex" },
  { value: "Rapid",             label: "Rapid" },
  { value: "Builder",           label: "Builder" },
  { value: "Pro",               label: "Pro" },
  { value: "Growth",            label: "Growth" },
  { value: "Select",            label: "Select" },
  { value: "Intraday",          label: "Intraday" },
  { value: "1-Step Monthly",    label: "1-Step" },
  { value: "Fast Track",        label: "Fast Track" },
  { value: "Static",            label: "Static" },
  { value: "Direct to Funded",  label: "Direct to Funded" },
  { value: "Diamond Hands",     label: "Diamond Hands" },
];

export const DRAWDOWN_OPTIONS = [
  { value: "end_of_day", label: "EOD" },
  { value: "trailing",   label: "Trailing" },
  { value: "static",     label: "Static" },
  { value: "intraday",   label: "Intraday" },
];

export const PLATFORM_OPTIONS = [
  "NinjaTrader",
  "TradingView",
  "Rithmic",
  "CQG",
  "Tradovate",
];

export const SORT_OPTIONS = [
  { value: "total_cost:asc",      label: "Total Cost ↑" },
  { value: "total_cost:desc",     label: "Total Cost ↓" },
  { value: "eval_fee:asc",        label: "Eval Fee ↑" },
  { value: "eval_fee:desc",       label: "Eval Fee ↓" },
  { value: "profit_split:desc",   label: "Profit Split ↓" },
  { value: "profit_split:asc",    label: "Profit Split ↑" },
  { value: "trustpilot:desc",     label: "Trustpilot ↓" },
];

export const ACCOUNT_SIZES = [
  { value: 0,       label: "All" },
  { value: 25000,   label: "25K" },
  { value: 50000,   label: "50K" },
  { value: 100000,  label: "100K" },
  { value: 150000,  label: "150K" },
  { value: 250000,  label: "250K" },
];
