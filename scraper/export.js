#!/usr/bin/env node
// scraper/export.js
// Exports SQLite data to data/plans.json

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prop_firm_data.db');
const outputPath = path.join(__dirname, '..', 'data', 'plans.json');

function exportToJson() {
  if (!fs.existsSync(dbPath)) {
    console.error(`Database not found at ${dbPath}`);
    process.exit(1);
  }
  
  const db = new Database(dbPath);
  
  const plans = db.prepare(`
    SELECT 
      firm_id, firm_name, firm_slug, logo_url, website_url, trustpilot,
      plan_id, account_size, plan_label, drawdown_type, drawdown_amount,
      daily_loss_limit, profit_target, profit_split, eval_fee, activation_fee,
      monthly_fee, is_one_time, payout_frequency, first_payout_days,
      total_cost_to_funded, active_discount_pct,
      retail_eval_fee, price_source, price_verified,
      CASE 
        WHEN retail_eval_fee IS NOT NULL AND retail_eval_fee > eval_fee 
        THEN 'promo_price_detected'
        ELSE 'ok'
      END AS price_status
    FROM plans
    ORDER BY firm_name, account_size
  `).all();
  
  // Ensure data directory exists
  const dataDir = path.dirname(outputPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(plans, null, 2));
  console.log(`✅ Exported ${plans.length} plans to ${outputPath}`);
  
  db.close();
}

exportToJson();