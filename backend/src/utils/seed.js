// seed.js — Populates the database with sample prop firm data
// Run: npm run seed

require("dotenv").config();
const { pool, query } = require("./db");

async function seed() {
  console.log("[seed] starting…");

  // ── Platforms ────────────────────────────────────────────
  await query(`
    INSERT INTO platforms (name) VALUES
      ('NinjaTrader'), ('TradingView'), ('Rithmic'),
      ('CQG'), ('Tradovate'), ('QuantTower'), ('Volfix')
    ON CONFLICT (name) DO NOTHING
  `);

  // ── Firms ────────────────────────────────────────────────
  const firms = [
    ["Topstep",             "topstep",             "https://topstep.com",             "The original futures prop firm. Chicago-based since 2012.",           "US", 2012, 4.3],
    ["Apex Trader Funding", "apex-trader-funding",  "https://apextraderfunding.com",   "$378M+ paid to traders. One-time fees, EOD drawdown option.",        "US", 2021, 4.5],
    ["MyFundedFutures",     "myfundedfutures",      "https://myfundedfutures.com",     "Established track record, rapid eval path, transparent payouts.",    "US", 2022, 4.4],
    ["TradeDay",            "tradeday",             "https://tradeday.com",            "Static trailing drawdown, no activation fees. Cleanest eval.",       "UK", 2021, 4.6],
    ["Lucid Trading",       "lucid-trading",        "https://lucidtrading.com",        "15-minute payouts via LucidFlex — fastest in the industry.",         "US", 2023, 4.2],
    ["Take Profit Trader",  "take-profit-trader",   "https://takeprofittrader.com",    "Day-one withdrawable profits. TPT branded.",                         "US", 2022, 4.1],
    ["Bulenox",             "bulenox",              "https://bulenox.com",             "Lowest pricing, widest size range.",                                 "US", 2022, 4.0],
    ["Elite Trader Funding","elite-trader-funding", "https://elitetraderfunding.com",  "Six eval models, 100% first $12.5K.",                               "US", 2021, 4.3],
    ["Earn2Trade",          "earn2trade",           "https://earn2trade.com",          "Education-first since 2016. Gauntlet Mini program.",                 "US", 2016, 4.2],
    ["Alpha Futures",       "alpha-futures",        "https://alpha-futures.com",       "Highest-rated futures prop firm.",                                   "US", 2023, 4.7],
  ];

  for (const [name, slug, url, desc, country, year, rating] of firms) {
    await query(
      `INSERT INTO firms (name, slug, website_url, description, hq_country, founded_year, trustpilot)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (slug) DO NOTHING`,
      [name, slug, url, desc, country, year, rating]
    );
  }

  // ── Firm ↔ Platform mappings ─────────────────────────────
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

  for (const [firmSlug, platformNames] of firmPlatforms) {
    for (const pName of platformNames) {
      await query(
        `INSERT INTO firm_platforms (firm_id, platform_id)
         SELECT f.id, p.id
         FROM firms f, platforms p
         WHERE f.slug = $1 AND p.name = $2
         ON CONFLICT DO NOTHING`,
        [firmSlug, pName]
      );
    }
  }

  // ── Plans ────────────────────────────────────────────────
  // (firm_slug, account_size, label, drawdown_type, drawdown_amount,
  //  daily_loss_limit, profit_target, eval_fee, activation_fee, monthly_fee,
  //  profit_split, is_one_time, payout_frequency)
  const plans = [
    // Topstep — monthly eval
    ["topstep", 50000,  "50K",  "end_of_day", 2000, 1000, 3000,  149,  0,  0, 80, false, "biweekly"],
    ["topstep", 100000, "100K", "end_of_day", 3000, 2000, 6000,  249,  0,  0, 80, false, "biweekly"],
    ["topstep", 150000, "150K", "end_of_day", 5000, 3000, 9000,  349,  0,  0, 80, false, "biweekly"],

    // Apex — one-time eval
    ["apex-trader-funding", 25000,  "25K",  "end_of_day", 1250,  625, 1500,  147, 0, 0, 100, true, "biweekly"],
    ["apex-trader-funding", 50000,  "50K",  "end_of_day", 2500, 1250, 3000,  167, 0, 0, 100, true, "biweekly"],
    ["apex-trader-funding", 100000, "100K", "end_of_day", 3000, 2000, 6000,  207, 0, 0, 100, true, "biweekly"],
    ["apex-trader-funding", 150000, "150K", "end_of_day", 5000, 3000, 9000,  297, 0, 0, 100, true, "biweekly"],
    ["apex-trader-funding", 250000, "250K", "end_of_day", 6500, 4000, 15000, 517, 0, 0, 100, true, "biweekly"],

    // MyFundedFutures
    ["myfundedfutures", 50000,  "50K",  "trailing",  2500, 1250, 3000,  200, 0, 0, 80, false, "biweekly"],
    ["myfundedfutures", 100000, "100K", "trailing",  3500, 2000, 6000,  300, 0, 0, 80, false, "biweekly"],
    ["myfundedfutures", 150000, "150K", "trailing",  5000, 3000, 9000,  400, 0, 0, 80, false, "biweekly"],

    // TradeDay
    ["tradeday", 50000,  "50K",  "static", 2000, 1000, 3000,  150, 0, 0, 90, false, "weekly"],
    ["tradeday", 100000, "100K", "static", 3000, 2000, 6000,  250, 0, 0, 90, false, "weekly"],
    ["tradeday", 150000, "150K", "static", 4500, 3000, 9000,  350, 0, 0, 90, false, "weekly"],

    // Lucid Trading
    ["lucid-trading", 50000,  "50K",  "trailing", 2500, 1250, 3000,  175, 0, 0, 80, false, "weekly"],
    ["lucid-trading", 100000, "100K", "trailing", 3500, 2000, 6000,  275, 0, 0, 80, false, "weekly"],

    // Take Profit Trader
    ["take-profit-trader", 50000,  "50K",  "end_of_day", 2000, 1000, 3000,  150, 0, 0, 80, false, "biweekly"],
    ["take-profit-trader", 100000, "100K", "end_of_day", 3000, 2000, 6000,  250, 0, 0, 80, false, "biweekly"],
    ["take-profit-trader", 150000, "150K", "end_of_day", 5000, 3000, 9000,  350, 0, 0, 80, false, "biweekly"],

    // Bulenox
    ["bulenox", 25000,  "25K",  "trailing", 1250,  500, 1500,  100, 0, 0, 80, true, "biweekly"],
    ["bulenox", 50000,  "50K",  "trailing", 2500, 1000, 3000,  150, 0, 0, 80, true, "biweekly"],
    ["bulenox", 100000, "100K", "trailing", 3500, 2000, 6000,  200, 0, 0, 80, true, "biweekly"],

    // Elite Trader Funding
    ["elite-trader-funding", 50000,  "50K",  "intraday", 2000, 1000, 3000,  155, 0, 0, 100, false, "biweekly"],
    ["elite-trader-funding", 100000, "100K", "intraday", 3000, 2000, 6000,  255, 0, 0, 100, false, "biweekly"],
    ["elite-trader-funding", 150000, "150K", "intraday", 5000, 3000, 9000,  355, 0, 0, 100, false, "biweekly"],

    // Earn2Trade
    ["earn2trade", 50000,  "50K",  "end_of_day", 2000, 1000, 3000,  150, 0, 0, 80, false, "biweekly"],
    ["earn2trade", 100000, "100K", "end_of_day", 3000, 2000, 6000,  250, 0, 0, 80, false, "biweekly"],
    ["earn2trade", 150000, "150K", "end_of_day", 5000, 3000, 9000,  350, 0, 0, 80, false, "biweekly"],

    // Alpha Futures
    ["alpha-futures", 50000,  "50K",  "static", 2000, 1000, 3000,  160, 0, 0, 90, true, "weekly"],
    ["alpha-futures", 100000, "100K", "static", 3000, 2000, 6000,  260, 0, 0, 90, true, "weekly"],
    ["alpha-futures", 150000, "150K", "static", 5000, 3000, 9000,  360, 0, 0, 90, true, "weekly"],
  ];

  for (const p of plans) {
    const [firmSlug, acct, label, ddType, ddAmt, dailyLoss, target, evalFee, actFee, monthly, split, oneTime, freq] = p;
    await query(
      `INSERT INTO plans (
        firm_id, account_size, label, drawdown_type, drawdown_amount,
        daily_loss_limit, profit_target, eval_fee, activation_fee, monthly_fee,
        profit_split, is_one_time, payout_frequency
      )
      SELECT f.id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      FROM firms f WHERE f.slug = $1
      ON CONFLICT DO NOTHING`,
      [firmSlug, acct, label, ddType, ddAmt, dailyLoss, target, evalFee, actFee, monthly, split, oneTime, freq]
    );
  }

  // ── Discount codes ───────────────────────────────────────
  await query(`
    INSERT INTO discount_codes (firm_id, code, discount_pct, valid_until)
    SELECT f.id, 'APEX20', 20, NOW() + INTERVAL '30 days'
    FROM firms f WHERE f.slug = 'apex-trader-funding'
    ON CONFLICT DO NOTHING
  `);
  await query(`
    INSERT INTO discount_codes (firm_id, code, discount_pct, valid_until)
    SELECT f.id, 'TOPSTEP10', 10, NOW() + INTERVAL '60 days'
    FROM firms f WHERE f.slug = 'topstep'
    ON CONFLICT DO NOTHING
  `);

  console.log("[seed] done ✓");
  await pool.end();
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
