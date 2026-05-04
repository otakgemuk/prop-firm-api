// Admin.tsx — Data editor page (password protected)
//
// A form-based UI to manage prop firm plans.
// Loads plans.json, lets you add/edit/remove plans,
// then downloads the updated JSON for you to upload to GitHub.

import { useState, useEffect, useCallback } from "react";
import type { PlanRow } from "./hooks/usePlans";

// ── Password gate ──────────────────────────────────────────
const DEFAULT_HASH = "51fa9d843acd4af113c93de66ceb65e0765b0015fbaaf6a4dfc0626010ef4fb0";
const HASH_KEY = "admin_pw_hash";
const SESSION_KEY = "admin_auth";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getStoredHash(): string {
  return localStorage.getItem(HASH_KEY) || DEFAULT_HASH;
}

function LoginGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [showChange, setShowChange] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [changeMsg, setChangeMsg] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved === "ok") setAuthenticated(true);
    setChecking(false);
  }, []);

  const handleLogin = async () => {
    setError("");
    const hash = await sha256(password);
    if (hash === getStoredHash()) {
      sessionStorage.setItem(SESSION_KEY, "ok");
      setAuthenticated(true);
    } else {
      setError("Wrong password");
      setPassword("");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeMsg("");
    const oldHash = await sha256(oldPw);
    if (oldHash !== getStoredHash()) { setChangeMsg("❌ Current password is wrong"); return; }
    if (newPw.length < 6) { setChangeMsg("❌ New password must be at least 6 characters"); return; }
    if (newPw !== newPw2) { setChangeMsg("❌ Passwords don't match"); return; }
    const newHash = await sha256(newPw);
    localStorage.setItem(HASH_KEY, newHash);
    setChangeMsg("✅ Password changed!");
    setOldPw(""); setNewPw(""); setNewPw2("");
    setTimeout(() => { setShowChange(false); setChangeMsg(""); }, 2000);
  };

  if (checking) return null;

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900/80 p-8">
          <h1 className="mb-2 text-xl font-bold text-white text-center">🔒 Admin Access</h1>
          <p className="mb-6 text-sm text-gray-400 text-center">Enter password to continue</p>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" autoFocus
              className="mb-3 w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <button type="submit"
              className="w-full rounded-lg bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {showChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gray-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)}
                placeholder="Current password" autoFocus
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500" />
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500" />
              <input type="password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500" />
              {changeMsg && (
                <p className={`text-sm ${changeMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>{changeMsg}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className="flex-1 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-400">Save</button>
                <button type="button" onClick={() => { setShowChange(false); setChangeMsg(""); setOldPw(""); setNewPw(""); setNewPw2(""); }}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-400 hover:text-white">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed top-0 right-0 z-40 p-2">
        <button onClick={() => setShowChange(true)}
          className="rounded-lg px-3 py-1.5 text-xs text-gray-500 transition hover:bg-white/5 hover:text-gray-300">
          🔑 Change Password
        </button>
      </div>
      {children}
    </>
  );
}

// ── Constants ──────────────────────────────────────────────

const EMPTY_PLAN: PlanRow = {
  firm_id: "", firm_name: "", firm_slug: "", logo_url: null, website_url: "",
  trustpilot: 0, plan_id: "", account_size: 50000, account_type: "Standard",
  plan_label: "50K", drawdown_type: "eod", drawdown_amount: 2000,
  daily_loss_limit: 1000, profit_target: 3000, profit_split: 80,
  eval_fee: 0, activation_fee: 0, monthly_fee: 0, is_one_time: 0,
  payout_frequency: "biweekly", base_cost_to_funded: 0, total_cost_to_funded: 0,
  active_discount_pct: 0, has_discount: 0, max_funded_status: "not_specified",
  max_funded_accounts: 0, min_trading_days: 0, consistency_eval: 0, consistency_funded: 0,
};

const DRAWDOWN_OPTIONS = ["eod", "trailing", "static", "intraday"];
const PAYOUT_OPTIONS = ["weekly", "biweekly"];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function nextFirmId(plans: PlanRow[]): string {
  const ids = plans.map((p) => parseInt(p.firm_id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const max = ids.length ? Math.max(...ids) : 0;
  return `f${String(max + 1).padStart(2, "0")}`;
}

function nextPlanId(plans: PlanRow[]): string {
  return `p${String(plans.length + 1).padStart(2, "0")}`;
}

function calcTotalCost(evalFee: number, activationFee: number, discountPct: number): number {
  const discountedEval = evalFee - (evalFee * discountPct) / 100;
  return Math.round((discountedEval + activationFee) * 100) / 100;
}

// ── Main Admin Component ───────────────────────────────────

function AdminContent() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<PlanRow>({ ...EMPTY_PLAN });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterFirm, setFilterFirm] = useState("");
  const [toast, setToast] = useState("");

  // Load data
  useEffect(() => {
    const draft = localStorage.getItem("admin_plans_draft");
    if (draft) {
      try { setPlans(JSON.parse(draft)); setLoading(false); return; } catch (e) { /* ignore */ }
    }
    fetch("./plans.json")
      .then(r => r.json())
      .then((data: PlanRow[]) => {
        const recalculated = data.map(p => ({
          ...p,
          total_cost_to_funded: calcTotalCost(p.eval_fee, p.activation_fee, p.active_discount_pct || 0),
        }));
        setPlans(recalculated);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (plans.length > 0) localStorage.setItem("admin_plans_draft", JSON.stringify(plans));
  }, [plans]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const firms = Array.from(new Map(plans.map((p) => [p.firm_id, { id: p.firm_id, name: p.firm_name }])).values());
  const filtered = filterFirm ? plans.filter((p) => p.firm_id === filterFirm) : plans;

  // ── Download plans.json ──────────────────────────────────
  const handleDownload = () => {
    const json = JSON.stringify(plans, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plans.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("📥 Downloaded plans.json — upload it to GitHub to deploy");
  };

  // ── Form helpers ─────────────────────────────────────────
  const updateField = (field: keyof PlanRow, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (["eval_fee", "activation_fee", "active_discount_pct"].includes(field)) {
        next.total_cost_to_funded = calcTotalCost(next.eval_fee, next.activation_fee, next.active_discount_pct);
      }
      if (field === "firm_name") next.firm_slug = slugify(value);
      if (field === "account_size") next.plan_label = `${(value / 1000).toFixed(0)}K`;
      return next;
    });
  };

  const handleAdd = () => {
    if (!form.firm_name || !form.eval_fee) { showToast("❌ Firm name and eval fee are required"); return; }
    const newPlan = {
      ...form,
      firm_id: form.firm_id || nextFirmId(plans),
      plan_id: form.plan_id || nextPlanId(plans),
      total_cost_to_funded: calcTotalCost(form.eval_fee, form.activation_fee, form.active_discount_pct),
    };
    setPlans((prev) => [...prev, newPlan]);
    setForm({ ...EMPTY_PLAN });
    setShowAddForm(false);
    showToast(`✅ Added ${newPlan.firm_name} ${newPlan.plan_label}`);
  };

  const handleEdit = (index: number) => {
    const realIndex = plans.indexOf(filtered[index]);
    setEditingIndex(realIndex);
    setForm({ ...plans[realIndex] });
    setShowAddForm(false);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...plans];
    updated[editingIndex] = {
      ...form,
      total_cost_to_funded: calcTotalCost(form.eval_fee, form.activation_fee, form.active_discount_pct),
    };
    setPlans(updated);
    setEditingIndex(null);
    setForm({ ...EMPTY_PLAN });
    showToast(`✅ Updated ${form.firm_name} ${form.plan_label}`);
  };

  const handleDelete = (index: number) => {
    const realIndex = plans.indexOf(filtered[index]);
    const p = plans[realIndex];
    if (!confirm(`Delete ${p.firm_name} ${p.plan_label}?`)) return;
    setPlans((prev) => prev.filter((_, i) => i !== realIndex));
    showToast(`🗑️ Deleted ${p.firm_name} ${p.plan_label}`);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Loading plans…</div>;
  }

  return (
    <div className="min-h-full bg-gray-950 text-gray-100">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white shadow-lg border border-white/10 animate-pulse">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-gray-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="./logo.png" alt="MightyOx Trading" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Mighty<span className="text-brand-400">Ox</span> Trading
              </h1>
              <p className="text-sm text-gray-400">{plans.length} plans across {firms.length} firms</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="./"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-brand-400 hover:text-white">
              ← Back to Site
            </a>
            <button onClick={handleDownload}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">
              ⬇ Download plans.json
            </button>
            <button onClick={() => {
              if (confirm("Clear all edits and reload from server?")) {
                localStorage.removeItem("admin_plans_draft");
                window.location.reload();
              }
            }}
              className="rounded-lg border border-orange-500/50 px-4 py-2 text-sm text-orange-300 transition hover:border-orange-400 hover:text-orange-200">
              ⟲ Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">

        {/* How to deploy */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-sm text-emerald-300 font-medium mb-2">🚀 How to update the live site</p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-emerald-200/80">
            <li>Edit plans below (add, edit, or delete)</li>
            <li>Click <strong className="text-emerald-300">⬇ Download plans.json</strong></li>
            <li>Go to <a href="https://github.com/otakgemuk/prop-firm-api/blob/main/data/plans.json" target="_blank" rel="noopener" className="text-brand-400 underline">data/plans.json on GitHub</a></li>
            <li>Click the ✏️ pencil icon → select all → paste the downloaded content → commit</li>
            <li>Site updates in ~2 minutes automatically</li>
          </ol>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterFirm} onChange={(e) => setFilterFirm(e.target.value)}
            className="rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white">
            <option value="">All Firms</option>
            {firms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <button onClick={() => {
            setEditingIndex(null);
            setForm({ ...EMPTY_PLAN, firm_id: nextFirmId(plans), plan_id: nextPlanId(plans) });
            setShowAddForm(true);
          }}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400">
            + Add Plan
          </button>
          <button onClick={() => {
            setEditingIndex(null);
            setForm({ ...EMPTY_PLAN, firm_id: "", plan_id: nextPlanId(plans) });
            setShowAddForm(true);
          }}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 transition hover:border-brand-400 hover:text-white">
            + Add New Firm
          </button>
        </div>

        {/* Add / Edit Form */}
        {(showAddForm || editingIndex !== null) && (
          <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              {editingIndex !== null ? "Edit Plan" : "Add New Plan"}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <Field label="Firm Name *" value={form.firm_name} onChange={(v) => updateField("firm_name", v)} placeholder="e.g. Topstep" />
              <Field label="Firm Slug" value={form.firm_slug} onChange={(v) => updateField("firm_slug", v)} placeholder="auto-generated" />
              <Field label="Website URL" value={form.website_url} onChange={(v) => updateField("website_url", v)} placeholder="https://..." />
              <Field label="Trustpilot" value={String(form.trustpilot)} type="number" onChange={(v) => updateField("trustpilot", parseFloat(v) || 0)} />
              <Field label="Account Size *" value={String(form.account_size)} type="number" onChange={(v) => updateField("account_size", parseInt(v) || 0)} />
              <Field label="Plan Label" value={form.plan_label} onChange={(v) => updateField("plan_label", v)} placeholder="auto from size" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Account Type</label>
                <select value={form.account_type || "Standard"} onChange={(e) => updateField("account_type", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white">
                  {["Standard", "No Activation", "No Scaling", "EOD", "EOD Drawdown", "Flex", "Rapid", "Builder", "Pro", "Growth", "Select", "Intraday", "1-Step Monthly", "Fast Track", "Static", "Direct to Funded", "Diamond Hands"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Drawdown Type</label>
                <select value={form.drawdown_type} onChange={(e) => updateField("drawdown_type", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white">
                  {DRAWDOWN_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Field label="Drawdown Amount" value={String(form.drawdown_amount)} type="number" onChange={(v) => updateField("drawdown_amount", parseInt(v) || 0)} />
              <Field label="Daily Loss Limit" value={String(form.daily_loss_limit)} type="number" onChange={(v) => updateField("daily_loss_limit", parseInt(v) || 0)} />
              <Field label="Profit Target" value={String(form.profit_target)} type="number" onChange={(v) => updateField("profit_target", parseInt(v) || 0)} />
              <Field label="Profit Split %" value={String(form.profit_split)} type="number" onChange={(v) => updateField("profit_split", parseInt(v) || 0)} />
              <Field label="Eval Fee *" value={String(form.eval_fee)} type="number" onChange={(v) => updateField("eval_fee", parseFloat(v) || 0)} />
              <Field label="Activation Fee" value={String(form.activation_fee)} type="number" onChange={(v) => updateField("activation_fee", parseFloat(v) || 0)} />
              <Field label="Monthly Fee" value={String(form.monthly_fee)} type="number" onChange={(v) => updateField("monthly_fee", parseFloat(v) || 0)} />
              <Field label="Discount %" value={String(form.active_discount_pct)} type="number" onChange={(v) => updateField("active_discount_pct", parseInt(v) || 0)} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Payout Frequency</label>
                <select value={form.payout_frequency} onChange={(e) => updateField("payout_frequency", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white">
                  {PAYOUT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={form.is_one_time === 1}
                    onChange={(e) => updateField("is_one_time", e.target.checked ? 1 : 0)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-brand-500" />
                  One-time payment
                </label>
              </div>
              <Field label="Logo URL" value={form.logo_url || ""} onChange={(v) => updateField("logo_url", v || null)} placeholder="optional" />
              <Field label="Max Funded Accounts" value={String(form.max_funded_accounts || 0)} type="number" onChange={(v) => updateField("max_funded_accounts", parseInt(v) || 0)} />
              <Field label="Min Trading Days" value={String(form.min_trading_days || 0)} type="number" onChange={(v) => updateField("min_trading_days", parseInt(v) || 0)} />
              <Field label="Consistency Eval %" value={String(form.consistency_eval || 0)} type="number" onChange={(v) => updateField("consistency_eval", parseInt(v) || 0)} />
              <Field label="Consistency Funded %" value={String(form.consistency_funded || 0)} type="number" onChange={(v) => updateField("consistency_funded", parseInt(v) || 0)} />
            </div>

            {/* Computed total */}
            <div className="mt-4 rounded-lg bg-brand-600/10 px-4 py-3 text-center">
              <span className="text-sm text-brand-300">Total Cost to Funded: </span>
              {form.active_discount_pct > 0 ? (
                <div>
                  <div className="text-sm text-gray-400 line-through">${(form.eval_fee + form.activation_fee).toFixed(2)}</div>
                  <div className="text-2xl font-bold text-green-400">
                    −{form.active_discount_pct}% → ${calcTotalCost(form.eval_fee, form.activation_fee, form.active_discount_pct).toFixed(2)}
                  </div>
                </div>
              ) : (
                <span className="text-xl font-bold text-brand-200">${calcTotalCost(form.eval_fee, form.activation_fee, form.active_discount_pct).toFixed(2)}</span>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {editingIndex !== null ? (
                <>
                  <button onClick={handleSaveEdit}
                    className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-400">Save Changes</button>
                  <button onClick={() => { setEditingIndex(null); setForm({ ...EMPTY_PLAN }); }}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={handleAdd}
                    className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-400">Add Plan</button>
                  <button onClick={() => { setShowAddForm(false); setForm({ ...EMPTY_PLAN }); }}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Plans Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-gray-900/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-400">Firm</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-400">Size</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-400">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase text-gray-400">Drawdown</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-gray-400">DD Amt</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-gray-400">Target</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-gray-400">Eval Fee</th>
                <th className="px-3 py-3 text-right text-xs font-semibold uppercase text-gray-400">Total</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan, i) => (
                <tr key={plan.plan_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 font-medium text-white">{plan.firm_name}</td>
                  <td className="px-3 py-2 text-gray-300">{plan.plan_label}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-300">{plan.account_type || "Standard"}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">{plan.drawdown_type}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">${plan.drawdown_amount.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-300">${plan.profit_target.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-300">${plan.eval_fee}</td>
                  <td className="px-3 py-2 text-right font-bold text-brand-300">${plan.total_cost_to_funded.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => handleEdit(i)} className="mr-2 text-xs text-brand-400 hover:text-brand-300">Edit</button>
                    <button onClick={() => handleDelete(i)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

// ── Reusable form field ────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-300">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400" />
    </div>
  );
}

export default function Admin() {
  return <LoginGate><AdminContent /></LoginGate>;
}
