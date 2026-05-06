// export.js — Export SQLite → data/plans.json
//
// Run AFTER the scraper has upserted fresh data into the DB.
// Produces the same flat denormalized JSON shape the frontend expects.
// Derived fields (total_cost_to_funded, active_discount_pct) are
// computed here in SQL instead of scattered across scraper parsers.
//
// Run: node backend/src/utils/export.js

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

// ── Paths ────────────────────────────────────────────────────
const DATA_DIR   = process.env.DATA_DIR || path.join(__dirname, "../../../data");
const DB_PATH    = process.env.DB_PATH  || path.join(DATA_DIR, "propfirm.db");
const PLANS_PATH = path.join(DATA_DIR, "plans.json");

const db = new Database(DB_PATH, { readonly: true });
db.pragma("foreign_keys = ON");

// ── Export query ─────────────────────────────────────────────
// Denormalised view: firm info + plan info in every row.
// total_cost_to_funded = eval_fee + activation_fee
//   (monthly_fee × 3 is added for recurring-fee plans).
// active_discount_pct  = best active discount for the firm (0 if none).
const rows = db.prepare(`
  WITH best_discount AS (
    SELECT
      firm_id,
      MAX(discount_pct) AS discount_pct
    FROM discount_codes
    WHERE is_active = 1
      AND (valid_from  IS NULL OR valid_from  <= datetime('now'))
      AND (valid_until IS NULL OR valid_until >= datetime('now'))
    GROUP BY firm_id
  )
  SELECT
    -- firm columns
    f.id                                                    AS firm_id,
    f.name                                                  AS firm_name,
    f.slug                                                  AS firm_slug,
    f.logo_url,
    f.website_url,
    f.trustpilot,
    -- plan columns
    p.id                                                    AS plan_id,
    p.account_size,
    p.account_type,
    p.label                                                 AS plan_label,
    p.drawdown_type,
    p.drawdown_amount,
    p.daily_loss_limit,
    p.profit_target,
    p.profit_split,
    p.eval_fee,
    p.activation_fee,
    p.monthly_fee,
    p.is_one_time,
    p.payout_frequency,
    -- manual / enrichment fields
    p.max_funded_accounts,
    p.min_trading_days,
    p.consistency_eval,
    p.consistency_funded,
    -- price provenance fields
    p.retail_eval_fee,
    p.price_source,
    p.price_verified,
    -- discount: prefer plan-level over firm-level
    COALESCE(NULLIF(p.discount_pct, 0), bd.discount_pct, 0) AS active_discount_pct,
    COALESCE(p.discount_amount, 0)                          AS discount_amount,
    -- derived fields
    ROUND(
      p.eval_fee + p.activation_fee +
      CASE WHEN p.is_one_time = 0 THEN p.monthly_fee * 3 ELSE 0 END,
      2
    )                                                       AS base_cost_to_funded,
    ROUND(
      p.eval_fee * (1 - COALESCE(NULLIF(p.discount_pct, 0), bd.discount_pct, 0) / 100.0)
      - COALESCE(p.discount_amount, 0) +
      p.activation_fee +
      CASE WHEN p.is_one_time = 0 THEN p.monthly_fee * 3 ELSE 0 END,
      2
    )                                                       AS total_cost_to_funded,
    -- validation fields
    CASE 
      WHEN COALESCE(NULLIF(p.discount_pct, 0), bd.discount_pct, 0) > 0 THEN 1
      ELSE 0
    END                                                     AS has_discount,
    CASE 
      WHEN COALESCE(p.max_funded_accounts, 0) = 0 THEN 'not_specified'
      ELSE 'specified'
    END                                                     AS max_funded_status,
    -- Price validation: detect if eval_fee is actually a promo price
    CASE 
      WHEN p.retail_eval_fee IS NOT NULL AND p.retail_eval_fee > p.eval_fee 
      THEN 'promo_price_detected'
      ELSE 'ok'
    END                                                     AS price_status
  FROM plans p
  JOIN firms f ON f.id = p.firm_id
  LEFT JOIN best_discount bd ON bd.firm_id = f.id
  WHERE p.is_active = 1
    AND f.is_active = 1
  ORDER BY f.name, p.account_size, p.account_type
`).all();

db.close();

// ── Add metadata ─────────────────────────────────────────────
const now = new Date();
const metadata = {
  last_updated: now.toISOString(),
  last_updated_formatted: now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC',
  total_plans: rows.length,
  total_firms: new Set(rows.map(r => r.firm_id)).size,
  plans_with_discounts: rows.filter(r => r.active_discount_pct > 0).length,
  data_version: '2.0' // Increment when data structure changes
};

// ── Write JSON ───────────────────────────────────────────────
// Keep the JSON as a flat array for backward compatibility,
// but add metadata as a separate file
fs.writeFileSync(PLANS_PATH, JSON.stringify(rows, null, 2) + "\n");

// Write metadata separately for frontend to display
const METADATA_PATH = path.join(DATA_DIR, "metadata.json");
fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2) + "\n");

console.log(`[export] Done ✓ — ${rows.length} plans written to ${PLANS_PATH}`);
console.log(`[export] Metadata written to ${METADATA_PATH}`);
console.log(`[export] Last updated: ${metadata.last_updated_formatted}`);
