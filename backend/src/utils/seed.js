// seed.js — Populates SQLite with sample prop firm data
// Run: node src/utils/seed.js

const { db } = require("./db");
const fs = require("fs");
const path = require("path");

function seed() {
  console.log("[seed] starting…");

  // Run the schema migration
  const schema = fs.readFileSync(
    path.join(__dirname, "../../migrations/001_schema.sql"),
    "utf8"
  );
  db.exec(schema);

  // Clear existing data (idempotent re-seed)
  db.exec("DELETE FROM discount_codes; DELETE FROM firm_platforms; DELETE FROM plans; DELETE FROM platforms; DELETE FROM firms;");

  // ── Platforms ────────────────────────────────────────────
  const insertPlatform = db.prepare("INSERT INTO platforms (name) VALUES (?)");
  const platforms = ["NinjaTrader", "TradingView", "Rithmic", "CQG", "Tradovate", "QuantTower", "Volfix"];
  for (const p of platforms) insertPlatform.run(p);

  // ── Firms ────────────────────────────────────────────────
  const insertFirm = db.prepare(`
    INSERT INTO firms (id, name, slug, website_url, description, hq_country, founded_year, trustpilot)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const firms = [
    ["f01", "Topstep",              "topstep",              "https://topstep.com",             "The original futures prop firm. Chicago-based since 2012.",           "US", 2012, 4.3],
    ["f02", "Apex Trader Funding",  "apex-trader-funding",  "https://apextraderfunding.com",   "$378M+ paid to traders. One-time fees, EOD drawdown option.",        "US", 2021, 4.5],
    ["f03", "MyFundedFutures",      "myfundedfutures",      "https://myfundedfutures.com",     "Established track record, rapid eval path, transparent payouts.",    "US", 2022, 4.4],
    ["f04", "TradeDay",             "tradeday",             "https://tradeday.com",            "Static trailing drawdown, no activation fees. Cleanest eval.",       "UK", 2021, 4.6],
    ["f05", "Lucid Trading",        "lucid-trading",        "https://lucidtrading.com",        "15-minute payouts via LucidFlex — fastest in the industry.",         "US", 2023, 4.2],
    ["f06", "Take Profit Trader",   "take-profit-trader",   "https://takeprofittrader.com",    "Day-one withdrawable profits. TPT branded.",                         "US", 2022, 4.1],
    ["f07", "Bulenox",              "bulenox",              "https://bulenox.com",             "Lowest pricing, widest size range.",                                 "US", 2022, 4.0],
    ["f08", "Elite Trader Funding", "elite-trader-funding", "https://elitetraderfunding.com",  "Six eval models, 100% first $12.5K.",                               "US", 2021, 4.3],
    ["f09", "Earn2Trade",           "earn2trade",           "https://earn2trade.com",          "Education-first since 2016. Gauntlet Mini program.",                 "US", 2016, 4.2],
    ["f10", "Alpha Futures",        "alpha-futures",        "https://alpha-futures.com",       "Highest-rated futures prop firm.",                                   "US", 2023, 4.7],
  ];
  for (const f of firms) insertFirm.run(...f);

  // ── Firm ↔ Platform mappings ─────────────────────────────
  const insertFP = db.prepare(`
    INSERT INTO firm_platforms (firm_id, platform_id)
    SELECT f.id, p.id FROM firms f, platforms p WHERE f.slug = ? AND p.name = ?
  `);
  const firmPlatforms = [
    ["topstep",             ["NinjaTrader", "Rithmic", "TradingView"]],
    ["apex-trader-funding", ["NinjaTrader", "Rithmic", "Tradovate", "TradingView"]],
    ["myfundedfutures",     ["NinjaTrader", "Rithmic", "TradingView"]],
    ["tradeday",            ["NinjaTrader", "Rithmic", "CQG"]],
    ["lucid-trading",       ["NinjaTrader", "Rithmic"]],
    ["take-profit-trader",  ["NinjaTrader", "Rithmic", "TradingView"]],
    ["bulenox",             ["NinjaTrader", "Rithmic", "QuantTower"]],
    ["elite-trader-funding",["NinjaTrader", "Rithmic", "TradingView"]],
    ["earn2trade",          ["NinjaTrader", "Rithmic", "TradingView"]],
    ["alpha-futures",       ["NinjaTrader", "Rithmic", "TradingView", "Volfix"]],
  ];
  for (const [slug, plats] of firmPlatforms) {
    for (const p of plats) insertFP.run(slug, p);
  }

  // ── Plans ────────────────────────────────────────────────
  const insertPlan = db.prepare(`
    INSERT INTO plans (id, firm_id, account_size, label, drawdown_type, drawdown_amount,
      daily_loss_limit, profit_target, eval_fee, activation_fee, monthly_fee,
      profit_split, is_one_time, payout_frequency)
    SELECT ?, f.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    FROM firms f WHERE f.slug = ?
  `);

  // Plan data: [id, account_size, label, drawdown_type, drawdown_amount,
  //              daily_loss_limit, profit_target, eval_fee, activation_fee, monthly_fee,
  //              profit_split, is_one_time, payout_frequency, firm_slug]
  // Note: firm_slug is LAST because the SQL uses it in WHERE f.slug = ? (14th param)
  const plans = [
    ["p01", 50000,  "50K",  "EOD", 2000, 1000, 3000,  149,  0,  0, 80, 0, "biweekly", "topstep"],
    ["p02", 100000, "100K", "EOD", 3000, 2000, 6000,  249,  0,  0, 80, 0, "biweekly", "topstep"],
    ["p03", 150000, "150K", "EOD", 5000, 3000, 9000,  349,  0,  0, 80, 0, "biweekly", "topstep"],

    ["p04", 25000,  "25K",  "EOD", 1250,  625, 1500,  147, 0, 0, 100, 1, "biweekly", "apex-trader-funding"],
    ["p05", 50000,  "50K",  "EOD", 2500, 1250, 3000,  167, 0, 0, 100, 1, "biweekly", "apex-trader-funding"],
    ["p06", 100000, "100K", "EOD", 3000, 2000, 6000,  207, 0, 0, 100, 1, "biweekly", "apex-trader-funding"],
    ["p07", 150000, "150K", "EOD", 5000, 3000, 9000,  297, 0, 0, 100, 1, "biweekly", "apex-trader-funding"],
    ["p08", 250000, "250K", "EOD", 6500, 4000, 15000, 517, 0, 0, 100, 1, "biweekly", "apex-trader-funding"],

    ["p09", 50000,  "50K",  "trailing",  2500, 1250, 3000,  200, 0, 0, 80, 0, "biweekly", "myfundedfutures"],
    ["p10", 100000, "100K", "trailing",  3500, 2000, 6000,  300, 0, 0, 80, 0, "biweekly", "myfundedfutures"],
    ["p11", 150000, "150K", "trailing",  5000, 3000, 9000,  400, 0, 0, 80, 0, "biweekly", "myfundedfutures"],

    ["p12", 50000,  "50K",  "static", 2000, 1000, 3000,  150, 0, 0, 90, 0, "weekly", "tradeday"],
    ["p13", 100000, "100K", "static", 3000, 2000, 6000,  250, 0, 0, 90, 0, "weekly", "tradeday"],
    ["p14", 150000, "150K", "static", 4500, 3000, 9000,  350, 0, 0, 90, 0, "weekly", "tradeday"],

    ["p15", 50000,  "50K",  "trailing", 2500, 1250, 3000,  175, 0, 0, 80, 0, "weekly", "lucid-trading"],
    ["p16", 100000, "100K", "trailing", 3500, 2000, 6000,  275, 0, 0, 80, 0, "weekly", "lucid-trading"],

    ["p17", 50000,  "50K",  "EOD", 2000, 1000, 3000,  150, 0, 0, 80, 0, "biweekly", "take-profit-trader"],
    ["p18", 100000, "100K", "EOD", 3000, 2000, 6000,  250, 0, 0, 80, 0, "biweekly", "take-profit-trader"],
    ["p19", 150000, "150K", "EOD", 5000, 3000, 9000,  350, 0, 0, 80, 0, "biweekly", "take-profit-trader"],

    ["p20", 25000,  "25K",  "trailing", 1250,  500, 1500,  100, 0, 0, 80, 1, "biweekly", "bulenox"],
    ["p21", 50000,  "50K",  "trailing", 2500, 1000, 3000,  150, 0, 0, 80, 1, "biweekly", "bulenox"],
    ["p22", 100000, "100K", "trailing", 3500, 2000, 6000,  200, 0, 0, 80, 1, "biweekly", "bulenox"],

    ["p23", 50000,  "50K",  "intraday", 2000, 1000, 3000,  155, 0, 0, 100, 0, "biweekly", "elite-trader-funding"],
    ["p24", 100000, "100K", "intraday", 3000, 2000, 6000,  255, 0, 0, 100, 0, "biweekly", "elite-trader-funding"],
    ["p25", 150000, "150K", "intraday", 5000, 3000, 9000,  355, 0, 0, 100, 0, "biweekly", "elite-trader-funding"],

    ["p26", 50000,  "50K",  "EOD", 2000, 1000, 3000,  150, 0, 0, 80, 0, "biweekly", "earn2trade"],
    ["p27", 100000, "100K", "EOD", 3000, 2000, 6000,  250, 0, 0, 80, 0, "biweekly", "earn2trade"],
    ["p28", 150000, "150K", "EOD", 5000, 3000, 9000,  350, 0, 0, 80, 0, "biweekly", "earn2trade"],

    ["p29", 50000,  "50K",  "static", 2000, 1000, 3000,  160, 0, 0, 90, 1, "weekly", "alpha-futures"],
    ["p30", 100000, "100K", "static", 3000, 2000, 6000,  260, 0, 0, 90, 1, "weekly", "alpha-futures"],
    ["p31", 150000, "150K", "static", 5000, 3000, 9000,  360, 0, 0, 90, 1, "weekly", "alpha-futures"],
  ];
  for (const p of plans) insertPlan.run(...p);

  // ── Discount codes ───────────────────────────────────────
  const insertDisc = db.prepare(`
    INSERT INTO discount_codes (id, firm_id, code, discount_pct, valid_until)
    SELECT ?, f.id, ?, ?, datetime('now', '+30 days')
    FROM firms f WHERE f.slug = ?
  `);
  insertDisc.run("d01", "APEX20", 20, "apex-trader-funding");
  insertDisc.run("d02", "TOPSTEP10", 10, "topstep");

  console.log(`[seed] done ✓ — ${firms.length} firms, ${plans.length} plans`);
  db.close();
}

seed();
