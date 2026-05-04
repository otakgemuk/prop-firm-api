// scraper/db.js — SQLite helper for the prop firm scraper.
//
// Provides a single upsertPlans(firmSlug, plans) function that
// writes scraped data into the DB without touching manually-curated
// fields (max_funded_accounts, min_trading_days, consistency_*).

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
const DB_PATH  = process.env.DB_PATH  || path.join(DATA_DIR, "propfirm.db");

// Open lazily so parsers can require this file without side-effects.
let _db = null;
function getDb() {
  if (!_db) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(
        `DB not found at ${DB_PATH}. ` +
        "Run 'node backend/src/utils/migrate.js' then 'node backend/src/utils/import-json.js' first."
      );
    }
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

// ── Normalize drawdown_type ────────────────────────────────────
// Standardize to lowercase for consistency.
function normalizeDrawdownType(value) {
  if (!value) return value;
  const normalized = String(value).toLowerCase();
  if (normalized === "end_of_day") return "eod";
  return normalized;
}

// ── Upsert scraped plans for one firm ───────────────────────
// `plans` is the array returned by a parser's scrape() method.
// Fields the scraper provides are updated; manual/enrichment
// fields (max_funded_accounts etc.) are left untouched.
// All drawdown_type values are normalized to EOD if needed.
function upsertPlans(firmSlug, plans) {
  const db = getDb();

  const upsert = db.prepare(`
    INSERT INTO plans (
      firm_id, account_size, account_type, label, drawdown_type,
      drawdown_amount, daily_loss_limit, profit_target,
      eval_fee, activation_fee, monthly_fee, profit_split,
      payout_frequency, is_one_time, is_active
    )
    SELECT
      f.id, $account_size, $account_type, $label, $drawdown_type,
      $drawdown_amount, $daily_loss_limit, $profit_target,
      $eval_fee, $activation_fee, $monthly_fee, $profit_split,
      $payout_frequency, $is_one_time, 1
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
      is_one_time       = excluded.is_one_time,
      is_active         = 1,
      updated_at        = datetime('now')
  `);

  // Mark all plans for this firm inactive before upserting the fresh
  // set — any plan missing from the new scrape will stay inactive.
  const deactivate = db.prepare(`
    UPDATE plans SET is_active = 0, updated_at = datetime('now')
    WHERE firm_id = (SELECT id FROM firms WHERE slug = ?)
  `);

  const runBatch = db.transaction((rows) => {
    deactivate.run(firmSlug);
    for (const p of rows) {
      upsert.run({
        firm_slug:         firmSlug,
        account_size:      p.account_size,
        account_type:      p.account_type      ?? "Standard",
        label:             p.plan_label        ?? p.label ?? null,
        drawdown_type:     normalizeDrawdownType(p.drawdown_type),
        drawdown_amount:   p.drawdown_amount   ?? null,
        daily_loss_limit:  p.daily_loss_limit  ?? null,
        profit_target:     p.profit_target     ?? null,
        eval_fee:          p.eval_fee,
        activation_fee:    p.activation_fee    ?? 0,
        monthly_fee:       p.monthly_fee       ?? 0,
        profit_split:      p.profit_split      ?? null,
        payout_frequency:  p.payout_frequency  ?? null,
        is_one_time:       p.is_one_time       ?? 0,
      });
    }
  });

  runBatch(plans);
}

// ── Read existing plans for a firm (used as scrape fallback) ─
function getExistingPlans(firmSlug) {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, f.name AS firm_name, f.slug AS firm_slug
    FROM plans p
    JOIN firms f ON f.id = p.firm_id
    WHERE f.slug = ? AND p.is_active = 1
  `).all(firmSlug);
}

function close() {
  if (_db) { _db.close(); _db = null; }
}

module.exports = { upsertPlans, getExistingPlans, close };
