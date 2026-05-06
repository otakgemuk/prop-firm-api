const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use the same database as the backend (data/propfirm.db)
const dbPath = path.join(__dirname, '..', 'data', 'propfirm.db');
let db = null;

function getDb() {
  if (!db) {
    if (!fs.existsSync(dbPath)) {
      throw new Error(
        `Database not found at ${dbPath}. Run 'npm run migrate' and 'npm run import' first.`
      );
    }
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Upsert a firm into the firms table (create if missing, update if exists)
function upsertFirm(d) {
  const db = getDb();
  db.prepare(`
    INSERT INTO firms (id, name, slug, logo_url, website_url, trustpilot, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(slug) DO UPDATE SET
      name        = excluded.name,
      logo_url    = excluded.logo_url,
      website_url = excluded.website_url,
      trustpilot  = excluded.trustpilot,
      updated_at  = datetime('now')
  `).run(
    d.firm_id, d.firm_name, d.firm_slug,
    d.logo_url || null, d.website_url || null, d.trustpilot || null
  );
}

// Normalize drawdown_type to match the CHECK constraint
function normalizeDrawdownType(value) {
  if (!value) return 'EOD';
  const v = String(value).toLowerCase();
  if (v === 'end_of_day' || v === 'eod') return 'EOD';
  if (v === 'trailing') return 'trailing';
  if (v === 'static') return 'static';
  if (v === 'intraday') return 'intraday';
  return 'EOD';
}

// Generate a stable plan ID from firm + size + type
function makePlanId(firmSlug, accountSize, accountType) {
  return `${firmSlug}-${accountSize}-${(accountType || 'Standard').toLowerCase().replace(/\s+/g, '-')}`;
}

// Upsert plans for a firm — replaces all plans for that firm
function upsertPlans(firmSlug, plans) {
  const db = getDb();

  // Ensure the firm exists
  if (plans.length > 0) {
    upsertFirm(plans[0]);
  }

  // Get the firm's internal ID
  const firm = db.prepare('SELECT id FROM firms WHERE slug = ?').get(firmSlug);
  if (!firm) {
    throw new Error(`Firm not found after upsert: ${firmSlug}`);
  }

  // Delete existing plans for this firm
  db.prepare('DELETE FROM plans WHERE firm_id = ?').run(firm.id);

  const insert = db.prepare(`
    INSERT INTO plans (
      id, firm_id, account_size, account_type, label, drawdown_type,
      drawdown_amount, daily_loss_limit, profit_target, eval_fee,
      activation_fee, monthly_fee, profit_split, payout_frequency,
      first_payout_days, is_one_time,
      max_funded_accounts, min_trading_days, consistency_eval, consistency_funded,
      retail_eval_fee, price_source, price_verified, discount_pct,
      is_active
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1
    )
  `);

  for (const p of plans) {
    insert.run(
      makePlanId(firmSlug, p.account_size, p.account_type),
      firm.id,
      p.account_size,
      p.account_type || 'Standard',
      p.plan_label || null,
      normalizeDrawdownType(p.drawdown_type),
      p.drawdown_amount || null,
      p.daily_loss_limit || null,
      p.profit_target || null,
      p.eval_fee,
      p.activation_fee || 0,
      p.monthly_fee || 0,
      p.profit_split || null,
      p.payout_frequency || 'biweekly',
      p.first_payout_days || null,
      p.is_one_time || 0,
      p.max_funded_accounts || null,
      p.min_trading_days || null,
      p.consistency_eval || null,
      p.consistency_funded || null,
      p.retail_eval_fee ?? p.eval_fee,
      p.price_source || 'scraper',
      p.price_verified || 0,
      p.discount_pct || 0
    );
  }

  console.log(`✅ Upserted ${plans.length} plans for ${firmSlug}`);
}

function getExistingPlans(firmSlug) {
  const db = getDb();
  const firm = db.prepare('SELECT id FROM firms WHERE slug = ?').get(firmSlug);
  if (!firm) return [];
  return db.prepare(`
    SELECT p.*, f.name AS firm_name, f.slug AS firm_slug, f.logo_url, f.website_url, f.trustpilot
    FROM plans p
    JOIN firms f ON f.id = p.firm_id
    WHERE f.slug = ?
  `).all(firmSlug);
}

function close() { if (db) { db.close(); db = null; } }

module.exports = { upsertPlans, getExistingPlans, close };
