// seed-discounts.js — Insert active discount codes into the database.
//
// Reads discount definitions from data/discounts.json instead of hardcoding
// them in source. This keeps promo codes out of the public repository.
//
// Run AFTER import-json so the firms table exists.
// Run: node backend/src/utils/seed-discounts.js

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

const DATA_DIR       = process.env.DATA_DIR || path.join(__dirname, "../../../data");
const DB_PATH        = process.env.DB_PATH  || path.join(DATA_DIR, "propfirm.db");
const DISCOUNTS_PATH = process.env.DISCOUNTS_PATH || path.join(DATA_DIR, "discounts.json");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// ── Load discount definitions from JSON ──────────────────────
if (!fs.existsSync(DISCOUNTS_PATH)) {
  console.warn(`[seed-discounts] No discounts file found at ${DISCOUNTS_PATH}, skipping.`);
  db.close();
  process.exit(0);
}

let DISCOUNTS;
try {
  DISCOUNTS = JSON.parse(fs.readFileSync(DISCOUNTS_PATH, "utf8"));
} catch (err) {
  console.error(`[seed-discounts] Failed to parse ${DISCOUNTS_PATH}: ${err.message}`);
  db.close();
  process.exit(1);
}

if (!Array.isArray(DISCOUNTS)) {
  console.error("[seed-discounts] discounts.json must be a JSON array");
  db.close();
  process.exit(1);
}

// ── Validate and upsert discount codes ───────────────────────
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
  if (!d.firm_slug || !d.code || !d.discount_pct) {
    console.warn(`[seed-discounts] Skipping invalid entry: ${JSON.stringify(d)}`);
    continue;
  }
  if (d.discount_pct < 1 || d.discount_pct > 100) {
    console.warn(`[seed-discounts] Invalid discount_pct for ${d.firm_slug}: ${d.discount_pct}`);
    continue;
  }
  const result = upsert.run(d);
  if (result.changes > 0) count++;
}

console.log(`[seed-discounts] Done — ${count} discount codes upserted from ${DISCOUNTS_PATH}`);
db.close();
