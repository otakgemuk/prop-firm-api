// OneUp Trader parser — single "OneUp" account type
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "oneup_trader",
  firmName: "OneUp Trader",
  firmSlug: "oneup-trader",
  websiteUrl: "https://oneuptrader.com",
  trustpilot: null,
};

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  label: "25K",  eval: 65,  act: 65,  target: 1500,  dd: 1500 },
  { size: 50000,  label: "50K",  eval: 75,  act: 75,  target: 3000,  dd: 2500 },
  { size: 100000, label: "100K", eval: 150, act: 0,   target: 6000,  dd: 3500 },
  { size: 150000, label: "150K", eval: 175, act: 0,   target: 9000,  dd: 5000 },
  { size: 250000, label: "250K", eval: 325, act: 0,   target: 15000, dd: 5500 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://oneuptrader.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    // Future: extract live prices
  } catch (e) {
    console.warn(`[oneup-trader] Live scrape failed, using known prices: ${e.message}`);
  }

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `oneup-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: cfg.label,
    accountType: "OneUp",
    drawdownType: "trailing",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: 1,
    minTradingDays: 10,
    consistencyEvalPct: null,
    consistencyFundedPct: null,
  }));
}

module.exports = { scrape };
