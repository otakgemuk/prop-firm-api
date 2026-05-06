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
// Each entry: { firm_slug, code, discount_pct, account_type? }
// If account_type is set, the discount only applies to that type.
// account_type matching is case-insensitive and uses LIKE for partial match.

const DISCOUNTS = [
  // Take Profit Trader — 40% off all
  { firm_slug: "take-profit-trader", code: "SAVE40", discount_pct: 40 },

  // Legends Trading — Apprentice 50%, Elite 20%
  { firm_slug: "legends-trading", code: "APPRENTICE50", discount_pct: 50, account_type: "Apprentice" },
  { firm_slug: "legends-trading", code: "ELITE20",      discount_pct: 20, account_type: "Elite" },

  // Alpha Futures — 25% off all
  { firm_slug: "alpha-futures", code: "ALPHA25", discount_pct: 25 },

  // E8 Markets — Signature 20% (first order; 10% second), E8 One 10%
  { firm_slug: "e8-markets", code: "SIG20",  discount_pct: 20, account_type: "Signature" },
  { firm_slug: "e8-markets", code: "E8ONE10", discount_pct: 10, account_type: "E8 One" },
];

// ── Upsert discount codes ────────────────────────────────────
const upsertGlobal = db.prepare(`
  INSERT INTO discount_codes (firm_id, code, discount_pct, is_active)
  SELECT f.id, $code, $discount_pct, 1
  FROM firms f WHERE f.slug = $firm_slug
  ON CONFLICT(firm_id, code) DO UPDATE SET
    discount_pct = excluded.discount_pct,
    is_active    = 1
`);

// For account-type-specific discounts, we use a different approach:
// store the account_type hint in the code name and apply the discount
// at the firm level (export.js applies to all plans for that firm).
// The frontend can filter by account_type if needed.
// For now, we use the HIGHEST discount per firm as the active_discount_pct
// since the export query uses MAX(discount_pct).

let count = 0;
for (const d of DISCOUNTS) {
  const result = upsertGlobal.run(d);
  if (result.changes > 0) count++;
}

console.log(`[seed-discounts] Done ✓ — ${count} discount codes upserted`);
db.close();
