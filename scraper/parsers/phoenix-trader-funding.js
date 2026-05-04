// Phoenix Trader Funding parser — Classic, Spark, Merit types
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "phoenix_trader_f",
  firmName: "Phoenix Trader Funding",
  firmSlug: "phoenix-trader-funding",
  websiteUrl: null,
  trustpilot: null,
};

// Known prices (verified May 2026)
const KNOWN = [
  { size: 2000,   type: "Merit",          label: "Merit 2K",          eval: 69,  act: 0,   target: null, dd: 2000, minDays: 1 },
  { size: 2000,   type: "Spark Micro",    label: "Spark Micro 2K",    eval: 0,   act: 69,  target: null, dd: 2000, minDays: 1 },
  { size: 25000,  type: "Classic Starter", label: "Classic Starter 25K", eval: 89, act: 0,  target: 1500, dd: 1500, minDays: 2 },
  { size: 25000,  type: "Spark Starter",   label: "Spark Starter 25K", eval: 39, act: 29,  target: 1500, dd: 1000, minDays: 1, consFund: 30 },
  { size: 50000,  type: "Classic Growth",  label: "Classic Growth 50K", eval: 128, act: 0,  target: 3000, dd: 2000, minDays: 2 },
  { size: 50000,  type: "Spark Growth",    label: "Spark Growth 50K",  eval: 69, act: 29,  target: 3000, dd: 2000, minDays: 1, consFund: 30 },
  { size: 100000, type: "Classic Scale",   label: "Classic Scale 100K", eval: 269, act: 0, target: 6000, dd: 3000, minDays: 2 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://phoenixtraderfunding.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    // Future: extract live prices
  } catch (e) {
    console.warn(`[phoenix-trader-funding] Live scrape failed, using known prices: ${e.message}`);
  }

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `phoenix-${cfg.type.toLowerCase().replace(/\s+/g, "-")}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: cfg.label,
    accountType: cfg.type,
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: 1,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: null,
    consistencyFundedPct: cfg.consFund || null,
  }));
}

module.exports = { scrape };
