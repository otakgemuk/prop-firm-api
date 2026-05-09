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
  eod:        { label: "EOD",      color: "bg-blue-500/20 text-blue-300" },
  trailing:   { label: "Trailing", color: "bg-purple-500/20 text-purple-300" },
  static:     { label: "Static",   color: "bg-emerald-500/20 text-emerald-300" },
  intraday:   { label: "Intraday", color: "bg-amber-500/20 text-amber-300" },
};

export const ACCOUNT_TYPE_OPTIONS = [
  { value: "1-Step",            label: "1-Step" },
  { value: "1-Step Monthly",    label: "1-Step Monthly" },
  { value: "Advanced",          label: "Advanced" },
  { value: "Apprentice",        label: "Apprentice" },
  { value: "Beginner",          label: "Beginner" },
  { value: "Builder",           label: "Builder" },
  { value: "Classic Growth",    label: "Classic Growth" },
  { value: "Classic Scale",     label: "Classic Scale" },
  { value: "Classic Starter",   label: "Classic Starter" },
  { value: "DH",                label: "DH" },
  { value: "DTF",               label: "DTF" },
  { value: "Diamond Hands",     label: "Diamond Hands" },
  { value: "Direct to Funded",  label: "Direct to Funded" },
  { value: "E2L",               label: "E2L" },
  { value: "EOD",               label: "EOD" },
  { value: "EOD Drawdown",      label: "EOD DD" },
  { value: "Elite",             label: "Elite" },
  { value: "Express MAX",       label: "Express MAX" },
  { value: "Express OG",        label: "Express OG" },
  { value: "Fast Track",        label: "Fast Track" },
  { value: "Fundamental",       label: "Fundamental" },
  { value: "Flex",              label: "Flex" },
  { value: "Gauntlet",          label: "Gauntlet" },
  { value: "Growth",            label: "Growth" },
  { value: "Instant",           label: "Instant" },
  { value: "Intraday",          label: "Intraday" },
  { value: "Lightning",         label: "Lightning" },
  { value: "LucidFlex",         label: "LucidFlex" },
  { value: "LucidPro",          label: "LucidPro" },
  { value: "Merit",             label: "Merit" },
  { value: "No Activation",     label: "No Activation" },
  { value: "No Scaling",        label: "No Scaling" },
  { value: "OneUp",             label: "OneUp" },
  { value: "Option 1",          label: "Option 1" },
  { value: "Option 2",          label: "Option 2" },
  { value: "Pro",               label: "Pro" },
  { value: "Premium",           label: "Premium" },
  { value: "Premium (No Act)",  label: "Premium (No Act)" },
  { value: "Rapid",             label: "Rapid" },
  { value: "S2F",               label: "S2F" },
  { value: "S2L 150K Edge",     label: "S2L 150K Edge" },
  { value: "S2L 300K Ultra",    label: "S2L 300K Ultra" },
  { value: "S2L 50K Core",      label: "S2L 50K Core" },
  { value: "Select",            label: "Select" },
  { value: "Signature Futures", label: "Signature Futures" },
  { value: "Spark Growth",      label: "Spark Growth" },
  { value: "Spark Starter",     label: "Spark Starter" },
  { value: "Standard",          label: "Standard" },
  { value: "Standard MAX",      label: "Standard MAX" },
  { value: "Standard OG",       label: "Standard OG" },
  { value: "Static",            label: "Static" },
  { value: "TCP",               label: "TCP" },
  { value: "Trail",             label: "Trail" },
  { value: "Zero",              label: "Zero" },
];

export const DRAWDOWN_OPTIONS = [
  { value: "eod", label: "EOD" },
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
