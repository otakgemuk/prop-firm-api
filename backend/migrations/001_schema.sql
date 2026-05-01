-- ============================================================
-- Prop Firm Comparison — Database Schema
-- PostgreSQL 15+
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- TABLE: firms
-- Core metadata about each prop firm.
-- ------------------------------------------------------------
CREATE TABLE firms (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL UNIQUE,          -- e.g. "Topstep"
    slug          TEXT NOT NULL UNIQUE,          -- URL-safe: "topstep"
    logo_url      TEXT,                          -- CDN or local path
    website_url   TEXT,                          -- affiliate / direct link
    description   TEXT,                          -- short blurb
    hq_country    TEXT,                          -- "US", "UK", etc.
    founded_year  SMALLINT,
    trustpilot    NUMERIC(2,1),                 -- 4.7, 3.2, etc.
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE: platforms
-- Trading platforms (NinjaTrader, TradingView, Rithmic, …)
-- ------------------------------------------------------------
CREATE TABLE platforms (
    id    SERIAL PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE                  -- "NinjaTrader"
);

-- ------------------------------------------------------------
-- TABLE: firm_platforms  (many-to-many)
-- Which platforms each firm supports.
-- ------------------------------------------------------------
CREATE TABLE firm_platforms (
    firm_id       UUID REFERENCES firms(id) ON DELETE CASCADE,
    platform_id   INT  REFERENCES platforms(id) ON DELETE CASCADE,
    PRIMARY KEY (firm_id, platform_id)
);

-- ------------------------------------------------------------
-- TABLE: plans
-- Each row = one purchasable account size at one firm.
-- A firm typically has 4-6 plans (50K, 100K, 150K, 250K …).
-- ------------------------------------------------------------
CREATE TABLE plans (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id           UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,

    -- Account configuration
    account_size      INT NOT NULL,                -- 50000, 100000, 150000 …
    label             TEXT,                        -- "50K", "150K" — display name
    drawdown_type     TEXT NOT NULL CHECK (drawdown_type IN (
                        'end_of_day',   -- EOD trailing
                        'trailing',     -- real-time trailing
                        'static',       -- static / non-trailing
                        'intraday'      -- intraday drawdown
                      )),
    drawdown_amount   INT,                        -- dollar amount (e.g. 2500)
    daily_loss_limit  INT,                        -- dollar amount
    profit_target     INT,                        -- first eval target
    scaling_target    INT,                        -- funded scaling target (nullable)

    -- Pricing
    eval_fee          NUMERIC(10,2) NOT NULL,     -- monthly or one-time eval cost
    activation_fee    NUMERIC(10,2) DEFAULT 0,    -- fee to activate after passing
    monthly_fee       NUMERIC(10,2) DEFAULT 0,    -- recurring platform/data fee

    -- Payout structure
    profit_split      SMALLINT DEFAULT 80,        -- trader's % (e.g. 80 = 80/20)
    payout_frequency  TEXT DEFAULT 'biweekly',    -- weekly, biweekly, monthly
    first_payout_days SMALLINT,                   -- days until first withdrawal

    -- Metadata
    is_one_time       BOOLEAN DEFAULT FALSE,      -- one-time fee vs monthly
    max_accounts      SMALLINT DEFAULT 1,
    notes             TEXT,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABLE: discount_codes
-- Active promotions that reduce eval_fee.
-- ------------------------------------------------------------
CREATE TABLE discount_codes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firm_id     UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    code        TEXT NOT NULL,                    -- "SAVE20"
    discount_pct SMALLINT NOT NULL CHECK (discount_pct BETWEEN 1 AND 100),
    valid_from  TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(firm_id, code)
);

-- ------------------------------------------------------------
-- INDEXES  (query-pattern driven)
-- ------------------------------------------------------------
CREATE INDEX idx_plans_firm         ON plans(firm_id);
CREATE INDEX idx_plans_account_size ON plans(account_size);
CREATE INDEX idx_plans_drawdown     ON plans(drawdown_type);
CREATE INDEX idx_plans_active       ON plans(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_discount_firm      ON discount_codes(firm_id) WHERE is_active = TRUE;
