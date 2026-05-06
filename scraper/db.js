const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'prop_firm_data.db');
let db = null;

function getDb() {
  if (!db) {
    const exists = fs.existsSync(dbPath);
    db = new Database(dbPath);
    if (!exists) createTables();
    else migrate();
  }
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      firm_id TEXT,
      firm_name TEXT,
      firm_slug TEXT,
      logo_url TEXT,
      website_url TEXT,
      trustpilot REAL,
      plan_id TEXT PRIMARY KEY,
      account_size INTEGER,
      account_type TEXT DEFAULT 'Standard',
      plan_label TEXT,
      drawdown_type TEXT,
      drawdown_amount INTEGER,
      daily_loss_limit INTEGER,
      profit_target INTEGER,
      profit_split INTEGER,
      eval_fee INTEGER,
      activation_fee INTEGER,
      monthly_fee INTEGER,
      is_one_time INTEGER,
      payout_frequency TEXT,
      first_payout_days INTEGER,
      total_cost_to_funded REAL,
      base_cost_to_funded REAL,
      active_discount_pct INTEGER,
      max_funded_accounts INTEGER,
      min_trading_days INTEGER,
      consistency_eval INTEGER,
      consistency_funded INTEGER
    );
  `);
}

// Add columns if they're missing (safe migration for existing DBs)
function migrate() {
  const columns = db.prepare(`PRAGMA table_info(plans)`).all().map(c => c.name);
  const addCol = (name, type) => {
    if (!columns.includes(name)) {
      db.exec(`ALTER TABLE plans ADD COLUMN ${name} ${type}`);
      console.log(`  + Added column: ${name}`);
    }
  };
  addCol('account_type', 'TEXT DEFAULT "Standard"');
  addCol('base_cost_to_funded', 'REAL');
  addCol('max_funded_accounts', 'INTEGER');
  addCol('min_trading_days', 'INTEGER');
  addCol('consistency_eval', 'INTEGER');
  addCol('consistency_funded', 'INTEGER');
}

function upsertPlans(firmSlug, plans) {
  const db = getDb();
  db.prepare(`DELETE FROM plans WHERE firm_slug = ?`).run(firmSlug);

  const insert = db.prepare(`
    INSERT INTO plans (
      firm_id, firm_name, firm_slug, logo_url, website_url, trustpilot,
      plan_id, account_size, account_type, plan_label, drawdown_type,
      drawdown_amount, daily_loss_limit, profit_target, profit_split,
      eval_fee, activation_fee, monthly_fee, is_one_time, payout_frequency,
      first_payout_days, total_cost_to_funded, base_cost_to_funded,
      active_discount_pct, max_funded_accounts, min_trading_days,
      consistency_eval, consistency_funded
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const upsertMany = db.transaction((plans) => {
    for (const p of plans) {
      insert.run(
        p.firm_id, p.firm_name, firmSlug, p.logo_url || null,
        p.website_url, p.trustpilot || 0, p.plan_id, p.account_size,
        p.account_type || "Standard", p.plan_label, p.drawdown_type,
        p.drawdown_amount, p.daily_loss_limit || null, p.profit_target,
        p.profit_split || null, p.eval_fee, p.activation_fee || 0,
        p.monthly_fee || 0, p.is_one_time || 0, p.payout_frequency || null,
        p.first_payout_days || null, p.total_cost_to_funded,
        p.base_cost_to_funded || p.eval_fee, p.active_discount_pct || 0,
        p.max_funded_accounts || null, p.min_trading_days || null,
        p.consistency_eval || null, p.consistency_funded || null
      );
    }
  });

  upsertMany(plans);
  console.log(`✅ Upserted ${plans.length} plans for ${firmSlug}`);
}

function getExistingPlans(firmSlug) {
  return getDb().prepare(`SELECT * FROM plans WHERE firm_slug = ?`).all(firmSlug);
}

function close() { if (db) { db.close(); db = null; } }

module.exports = { upsertPlans, getExistingPlans, close };
