// import-json.js — Bootstrap SQLite from data/plans.json.
//
// Run at the START of every CI scrape job, before the scraper runs.
// This loads the last committed snapshot into the DB so the scraper
// has accurate fallback data if any live scrape fails.
//
// Safe to run multiple times (upserts, not inserts).
// Run: node backend/src/utils/import-json.js

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

// ── Paths ────────────────────────────────────────────────────
const DATA_DIR   = process.env.DATA_DIR || path.join(__dirname, "../../../../data");
const DB_PATH    = process.env.DB_PATH  || path.join(DATA_DIR, "propfirm.db");
const PLANS_PATH = path.join(DATA_DIR, "plans.json");

if (!fs.existsSync(PLANS_PATH)) {
  console.error("[import-json] data/plans.json not found — nothing to import.");
  process.exit(1);
}

const plans = JSON.parse(fs.readFileSync(PLANS_PATH, "utf8"));
const db    = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Normalize drawdown_type ──────────────────────────────────
// Convert any 'end_of_day' values to 'EOD' for consistency.
// This handles legacy data or data collected from external sources.
function normalizeDrawdownType(value) {
  if (!value) return value;
  const normalized = String(value).toLowerCase();
  if (normalized === "end_of_day" || normalized === "eod") {
    return "EOD";
  }
  // Return as-is for other types: trailing, static, intraday
  return value;
}

// ── Prepared statements ──────────────────────────────────────
const upsertFirm = db.prepare(`
  INSERT INTO firms (id, name, slug, logo_url, website_url, trustpilot, is_active)
  VALUES ($id, $name, $slug, $logo_url, $website_url, $trustpilot, 1)
  ON CONFLICT(slug) DO UPDATE SET
    name       = excluded.name,
    logo_url   = excluded.logo_url,
    website_url= excluded.website_url,
    trustpilot = excluded.trustpilot,
    updated_at = datetime('now')
`);

const upsertPlan = db.prepare(`
  INSERT INTO plans (
    id, firm_id, account_size, account_type, label, drawdown_type,
    drawdown_amount, daily_loss_limit, profit_target, eval_fee,
    activation_fee, monthly_fee, profit_split, payout_frequency,
    first_payout_days, is_one_time,
    max_funded_accounts, min_trading_days, consistency_eval, consistency_funded
  )
  SELECT
    $id, f.id, $account_size, $account_type, $label, $drawdown_type,
    $drawdown_amount, $daily_loss_limit, $profit_target, $eval_fee,
    $activation_fee, $monthly_fee, $profit_split, $payout_frequency,
    $first_payout_days, $is_one_time,
    $max_funded_accounts, $min_trading_days, $consistency_eval, $consistency_funded
  FROM firms f WHERE f.slug = $firm_slug
  ON CONFLICT(firm_id, account_size, account_type) DO UPDATE SET
    label             = excluded.label,
    drawdown_type     = excluded.drawdown_type,
    drawdown_amount   = excluded.drawdown_amount,
    daily_loss_limit  = excluded.daily_loss_limit,
    profit_target     = excluded.profit_target,
    eval_fee          = excluded.eval_fee,
    activation_fee    = excluded.activation_fee,
    monthly_fee       = excluded.monthly_fee,
    profit_split      = excluded.profit_split,
    payout_frequency  = excluded.payout_frequency,
    first_payout_days = excluded.first_payout_days,
    is_one_time       = excluded.is_one_time,
    -- only fill manual fields when they are currently NULL in the DB
    max_funded_accounts = COALESCE(plans.max_funded_accounts, excluded.max_funded_accounts),
    min_trading_days    = COALESCE(plans.min_trading_days,    excluded.min_trading_days),
    consistency_eval    = COALESCE(plans.consistency_eval,    excluded.consistency_eval),
    consistency_funded  = COALESCE(plans.consistency_funded,  excluded.consistency_funded),
    updated_at          = datetime('now')
`);

// ── Import inside a transaction ──────────────────────────────
const importAll = db.transaction((rows) => {
  let firmCount = 0;
  let planCount = 0;

  // Deduplicate firms from the flat array
  const firms = new Map();
  for (const p of rows) {
    if (!firms.has(p.firm_slug)) {
      firms.set(p.firm_slug, {
        id:          p.firm_id,
        name:        p.firm_name,
        slug:        p.firm_slug,
        logo_url:    p.logo_url   ?? null,
        website_url: p.website_url ?? null,
        trustpilot:  p.trustpilot  ?? null,
      });
    }
  }
  for (const firm of firms.values()) {
    upsertFirm.run(firm);
    firmCount++;
  }

  for (const p of rows) {
    upsertPlan.run({
      id:                 p.plan_id     ?? null,
      firm_slug:          p.firm_slug,
      account_size:       p.account_size,
      account_type:       p.account_type        ?? "Standard",
      label:              p.plan_label           ?? null,
      drawdown_type:      normalizeDrawdownType(p.drawdown_type),
      drawdown_amount:    p.drawdown_amount      ?? null,
      daily_loss_limit:   p.daily_loss_limit     ?? null,
      profit_target:      p.profit_target        ?? null,
      eval_fee:           p.eval_fee,
      activation_fee:     p.activation_fee       ?? 0,
      monthly_fee:        p.monthly_fee          ?? 0,
      profit_split:       p.profit_split         ?? null,
      payout_frequency:   p.payout_frequency     ?? null,
      first_payout_days:  p.first_payout_days    ?? null,
      is_one_time:        p.is_one_time          ?? 0,
      max_funded_accounts:p.max_funded_accounts  ?? null,
      min_trading_days:   p.min_trading_days     ?? null,
      consistency_eval:   p.consistency_eval     ?? null,
      consistency_funded: p.consistency_funded   ?? null,
    });
    planCount++;
  }

  return { firmCount, planCount };
});

const { firmCount, planCount } = importAll(plans);
console.log(`[import-json] Done ✓ — ${firmCount} firms, ${planCount} plans imported into DB`);
db.close();
