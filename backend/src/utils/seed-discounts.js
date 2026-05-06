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
// Each entry: { firm_slug, code, discount_pct }
const DISCOUNTS = [
  { firm_slug: "take-profit-trader", code: "SAVE40", discount_pct: 40 },
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
