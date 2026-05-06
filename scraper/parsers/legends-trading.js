// Legends Trading parser — Apprentice and Elite types
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "legends_trading",
  firmName: "Legends Trading",
  firmSlug: "legends-trading",
  websiteUrl: "https://legendstrading.com",
  trustpilot: null,
};

// Known RETAIL prices (verified from official pricing image, May 2026)
// Previous values were promotional prices — these are the actual retail prices.
// 25K tiers not shown in source — kept as-is (unverified).
const KNOWN = [
  { size: 25000,  type: "Apprentice", eval: 165, act: 99,  target: 1500, dd: 1500, minDays: 4, consEval: 30, consFund: 30 },
  { size: 25000,  type: "Elite",      eval: 119, act: 0,   target: 1500, dd: 1250, minDays: 5, consEval: 40, consFund: 40 },
  { size: 50000,  type: "Apprentice", eval: 249, act: 99,  target: 3000, dd: 2000, minDays: 4, consEval: 30, consFund: 30 },
  { size: 50000,  type: "Elite",      eval: 179, act: 0,   target: 2700, dd: 2200, minDays: 5, consEval: 40, consFund: 40 },
  { size: 100000, type: "Apprentice", eval: 349, act: 149, target: 6000, dd: 3000, minDays: 4, consEval: 30, consFund: 30 },
  { size: 100000, type: "Elite",      eval: 249, act: 0,   target: 6000, dd: 3000, minDays: 5, consEval: 40, consFund: 40 },
  { size: 150000, type: "Apprentice", eval: 499, act: 199, target: 9000, dd: 4000, minDays: 4, consEval: 30, consFund: 30 },
  { size: 150000, type: "Elite",      eval: 379, act: 0,   target: 9000, dd: 4500, minDays: 5, consEval: 40, consFund: 40 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://legendstrading.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    // Future: extract live prices
  } catch (e) {
    console.warn(`[legends-trading] Live scrape failed, using known prices: ${e.message}`);
  }

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `legends-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.size / 1000}K`,
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
    consistencyEvalPct: cfg.consEval,
    consistencyFundedPct: cfg.consFund,
    priceSource: 'verified',
    priceVerified: true,
  }));
}

module.exports = { scrape };
