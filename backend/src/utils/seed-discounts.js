// seed-discounts.js — Insert active discount codes into the database.
//
// Run AFTER import-json so the firms table exists.
// Discount codes are used by export.js to compute total_cost_to_funded.
//
// Run: node backend/src/utils/seed-discounts.js

const Database = require("better-sqlite3");
const path     = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../../../data");
const DB_PATH  = process.env.DB_PATH  || path.join(DATA_DIR, "propfirm.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// ── Discount definitions ─────────────────────────────────────
// Export uses MAX(discount_pct) per firm, so highest discount wins.
const DISCOUNTS = [
  // Take Profit Trader — 40% off all
  { firm_slug: "take-profit-trader", code: "SAVE40", discount_pct: 40 },

  // Legends Trading — Apprentice 50%, Elite 20%
  // Export applies 50% to all (highest per firm)
  { firm_slug: "legends-trading", code: "APPRENTICE50", discount_pct: 50 },
  { firm_slug: "legends-trading", code: "ELITE20",      discount_pct: 20 },

  // Alpha Futures — 25% off all
  { firm_slug: "alpha-futures", code: "ALPHA25", discount_pct: 25 },

  // E8 Markets — Signature 20%, E8 One 10%
  // Export applies 20% to all (highest per firm)
  { firm_slug: "e8-markets", code: "SIG20",   discount_pct: 20 },
  { firm_slug: "e8-markets", code: "E8ONE10", discount_pct: 10 },

  // Phidias — per-plan-type discounts (applied correctly in plans.json)
  // 50% OFF 25K Evaluation, 60% OFF Fundamental & Swing, 80% OFF OTP
  // Note: export applies MAX per firm, so these codes are for reference.
  // Actual per-plan discounts are set directly in plans.json data.
  { firm_slug: "phidias", code: "EVAL50",    discount_pct: 50 },
  { firm_slug: "phidias", code: "FUND60",    discount_pct: 60 },
  { firm_slug: "phidias", code: "OTP80",     discount_pct: 80 },

  // Purdia Capital — no verified discount codes (previous code was for promo-priced data)
  // { firm_slug: "purdia", code: "PURDIA25", discount_pct: 25 },
];

// ── Upsert discount codes ────────────────────────────────────
const upsert = db.prepare(`
  INSERT INTO discount_codes (firm_id, code, discount_pct, is_active)
  SELECT f.id, $code, $discount_pct, 1
  FROM firms f WHERE f.slug = $firm_slug
  ON CONFLICT(firm_id, code) DO UPDATE SET
    discount_pct = excluded.discount_pct,
    is_active    = 1
`);

let count = 0;
for (const d of DISCOUNTS) {
  const result = upsert.run(d);
  if (result.changes > 0) count++;
}

console.log(`[seed-discounts] Done ✓ — ${count} discount codes upserted`);
db.close();
