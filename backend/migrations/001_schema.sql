-- ============================================================
-- Prop Firm Comparison — SQLite Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS firms (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name          TEXT NOT NULL UNIQUE,
    slug          TEXT NOT NULL UNIQUE,
    logo_url      TEXT,
    website_url   TEXT,
    description   TEXT,
    hq_country    TEXT,
    founded_year  INTEGER,
    trustpilot    REAL,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platforms (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS firm_platforms (
    firm_id       TEXT REFERENCES firms(id) ON DELETE CASCADE,
    platform_id   INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    PRIMARY KEY (firm_id, platform_id)
);

CREATE TABLE IF NOT EXISTS plans (
    id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    firm_id             TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    account_size        INTEGER NOT NULL,
    account_type        TEXT NOT NULL DEFAULT 'Standard',
    label               TEXT,
    drawdown_type       TEXT NOT NULL CHECK (drawdown_type IN ('EOD','trailing','static','intraday')),
    drawdown_amount     INTEGER,
    daily_loss_limit    INTEGER,
    profit_target       INTEGER,
    scaling_target      INTEGER,
    eval_fee            REAL NOT NULL,
    activation_fee      REAL DEFAULT 0,
    monthly_fee         REAL DEFAULT 0,
    profit_split        INTEGER DEFAULT 80,
    payout_frequency    TEXT DEFAULT 'biweekly',
    first_payout_days   INTEGER,
    is_one_time         INTEGER DEFAULT 0,
    -- manual fields: not overwritten by the scraper, set once by hand
    max_funded_accounts INTEGER DEFAULT 1,
    min_trading_days    INTEGER,
    consistency_eval    INTEGER,
    consistency_funded  INTEGER,
    notes               TEXT,
    is_active           INTEGER NOT NULL DEFAULT 1,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    -- natural key used for upserts: one plan per (firm, size, type)
    UNIQUE (firm_id, account_size, account_type)
);

CREATE TABLE IF NOT EXISTS discount_codes (
    id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    firm_id       TEXT NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    code          TEXT NOT NULL,
    discount_pct  INTEGER NOT NULL CHECK (discount_pct BETWEEN 1 AND 100),
    valid_from    TEXT,
    valid_until   TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    UNIQUE(firm_id, code)
);

CREATE INDEX IF NOT EXISTS idx_plans_firm         ON plans(firm_id);
CREATE INDEX IF NOT EXISTS idx_plans_account_size ON plans(account_size);
CREATE INDEX IF NOT EXISTS idx_plans_drawdown     ON plans(drawdown_type);
CREATE INDEX IF NOT EXISTS idx_discount_firm      ON discount_codes(firm_id) WHERE is_active = 1;
