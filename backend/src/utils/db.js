// db.js — SQLite database wrapper (better-sqlite3)
// Zero-config, file-based. DB lives at backend/data/propfirm.db

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, "propfirm.db");
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

module.exports = { db };
