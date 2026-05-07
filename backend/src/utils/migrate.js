// migrate.js — Apply the SQLite schema and any incremental column additions.
//
// Safe to run multiple times (idempotent).
// Run: node backend/src/utils/migrate.js

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

// ── Resolve DB path ─────────────────────────────────────────
// Canonical location is the root data/ directory so both the
// scraper and backend share the same file.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "propfirm.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Helper: add a column only when it doesn't already exist ─
function addColumnIfMissing(table, column, definition) {
  const existing = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!existing.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`[migrate] Added ${table}.${column}`);
  }
}

// ── Run base schema ─────────────────────────────────────────
console.log("[migrate] Applying schema…");
const schema = fs.readFileSync(
  path.join(__dirname, "../../migrations/001_schema.sql"),
  "utf8"
);
db.exec(schema);

// ── Forward-compatible column additions ─────────────────────
// These handle DBs created before the schema was updated so
// running migrations on an existing file is always safe.
addColumnIfMissing("plans", "account_type",        "TEXT NOT NULL DEFAULT 'Standard'");
addColumnIfMissing("plans", "min_trading_days",    "INTEGER");
addColumnIfMissing("plans", "consistency_eval",    "INTEGER");
addColumnIfMissing("plans", "consistency_funded",  "INTEGER");
addColumnIfMissing("plans", "max_funded_accounts", "INTEGER DEFAULT 1");

console.log("[migrate] Done ✓ — DB at", DB_PATH);
db.close();
