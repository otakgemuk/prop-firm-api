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

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  type: "Apprentice", eval: 165, act: 99,  target: 1500, dd: 1500, minDays: 4, consEval: 30, consFund: 30 },
  { size: 25000,  type: "Elite",      eval: 95,  act: 0,   target: 1500, dd: 1250, minDays: 5, consEval: 40, consFund: 40 },
  { size: 50000,  type: "Apprentice", eval: 185, act: 99,  target: 3000, dd: 2000, minDays: 4, consEval: 30, consFund: 30 },
  { size: 50000,  type: "Elite",      eval: 121, act: 0,   target: 2700, dd: 2200, minDays: 5, consEval: 40, consFund: 40 },
  { size: 100000, type: "Apprentice", eval: 225, act: 149, target: 6000, dd: 3000, minDays: 4, consEval: 30, consFund: 30 },
  { size: 100000, type: "Elite",      eval: 182, act: 0,   target: 6000, dd: 3000, minDays: 5, consEval: 40, consFund: 40 },
  { size: 150000, type: "Apprentice", eval: 320, act: 199, target: 9000, dd: 4000, minDays: 4, consEval: 30, consFund: 30 },
  { size: 150000, type: "Elite",      eval: 278, act: 0,   target: 9000, dd: 4500, minDays: 5, consEval: 40, consFund: 40 },
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
  }));
}

module.exports = { scrape };
