// ComparisonCard.tsx
//
// A visual card that summarises one plan.
// Used in the "Card View" toggle (alternative to table rows).

import type { PlanRow } from "../hooks/usePlans";
import { formatUSD, DRAWDOWN_STYLES } from "../lib/utils";

export default function ComparisonCard({ plan }: { plan: PlanRow }) {
  const dd = DRAWDOWN_STYLES[plan.drawdown_type] ?? {
    label: plan.drawdown_type,
    color: "bg-gray-500/20 text-gray-300",
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-gray-900/80
                    p-5 shadow-lg transition hover:border-brand-400/50 hover:shadow-brand-400/10">

      {/* ── Header: logo + firm name ──────────────────────── */}
      <div className="flex items-center gap-3">
        {plan.logo_url ? (
          <img
            src={plan.logo_url}
            alt={plan.firm_name}
            className="h-10 w-10 rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/30
                          text-lg font-bold text-brand-300">
            {plan.firm_name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-white">{plan.firm_name}</h3>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${dd.color}`}>
            {dd.label}
          </span>
        </div>
      </div>

      {/* ── Account size (hero number) ────────────────────── */}
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-white">
          {plan.plan_label || formatUSD(plan.account_size)}
        </p>
        <p className="text-sm text-gray-400">Account Size</p>
      </div>

      {/* ── Key metrics grid ──────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Eval Fee"       value={formatUSD(plan.eval_fee)} />
        <Metric label="Activation"     value={plan.activation_fee ? formatUSD(plan.activation_fee) : "—"} />
        <Metric label="Profit Split"   value={`${plan.profit_split}%`} />
        <Metric label="Drawdown"       value={formatUSD(plan.drawdown_amount)} />
        <Metric label="Daily Loss"     value={formatUSD(plan.daily_loss_limit)} />
        <Metric label="Target"         value={formatUSD(plan.profit_target)} />
      </div>

      {/* ── Total cost highlight ──────────────────────────── */}
      <div className="mt-4 rounded-xl bg-brand-600/10 p-3 text-center">
        <p className="text-xs uppercase tracking-wider text-brand-300">Total Cost to Funded</p>
        <p className="mt-1 text-2xl font-bold text-brand-200">
          {formatUSD(plan.total_cost_to_funded)}
        </p>
        {plan.active_discount_pct > 0 && (
          <span className="mt-1 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
            {plan.active_discount_pct}% off
          </span>
        )}
      </div>

      {/* ── CTA ───────────────────────────────────────────── */}
      <a
        href={plan.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full rounded-xl bg-brand-500 py-2.5 text-center text-sm font-semibold
                   text-white transition hover:bg-brand-400 focus:outline-none focus:ring-2
                   focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-gray-950"
      >
        Buy Now →
      </a>
    </div>
  );
}

// ── Tiny sub-component for metric rows ─────────────────────
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
