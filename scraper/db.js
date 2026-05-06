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
  }
  return db;
}

function createTables() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      firm_id TEXT, firm_name TEXT, firm_slug TEXT, logo_url TEXT,
      website_url TEXT, trustpilot REAL, plan_id TEXT PRIMARY KEY,
      account_size INTEGER, plan_label TEXT, drawdown_type TEXT,
      drawdown_amount INTEGER, daily_loss_limit INTEGER,
      profit_target INTEGER, profit_split INTEGER, eval_fee INTEGER,
      activation_fee INTEGER, monthly_fee INTEGER, is_one_time INTEGER,
      payout_frequency TEXT, first_payout_days INTEGER,
      total_cost_to_funded REAL, active_discount_pct INTEGER
    );
  `);
}

function upsertPlans(firmSlug, plans) {
  const db = getDb();
  db.prepare(`DELETE FROM plans WHERE firm_slug = ?`).run(firmSlug);
  
  const insert = db.prepare(`
    INSERT INTO plans VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  for (const p of plans) {
    insert.run(
      p.firm_id, p.firm_name, firmSlug, p.logo_url || null,
      p.website_url, p.trustpilot || 0, p.plan_id, p.account_size,
      p.plan_label, p.drawdown_type, p.drawdown_amount,
      p.daily_loss_limit || null, p.profit_target, p.profit_split,
      p.eval_fee, p.activation_fee || 0, p.monthly_fee || 0,
      p.is_one_time || 0, p.payout_frequency || 'biweekly',
      p.first_payout_days || null, p.total_cost_to_funded,
      p.active_discount_pct || 0
    );
  }
  console.log(`✅ Upserted ${plans.length} plans for ${firmSlug}`);
}

function getExistingPlans(firmSlug) {
  return getDb().prepare(`SELECT * FROM plans WHERE firm_slug = ?`).all(firmSlug);
}

function close() { if (db) { db.close(); db = null; } }

module.exports = { upsertPlans, getExistingPlans, close };