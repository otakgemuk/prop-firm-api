// Phidias Propfirm parser — Express to Live, Fundamental, Premium types
// Lifetime (one-time) pricing, no monthly fees
const { buildPlan } = require("../utils");

const FIRM = {
  firmId: "phidias",
  firmName: "Phidias Propfirm",
  firmSlug: "phidias",
  websiteUrl: "https://phidiaspropfirm.com",
  trustpilot: null,
};

// Known RETAIL prices (verified May 2026)
const KNOWN = [
  // Express to Live — static drawdown, lifetime pricing
  { size: 25000,  type: "Express to Live", eval: 277,   act: 0, target: 1500,  dd: 500,  ddType: "static", minDays: 0 },
  { size: 50000,  type: "Express to Live", eval: 723,   act: 0, target: 3000,  dd: 1000, ddType: "static", minDays: 0 },
  { size: 100000, type: "Express to Live", eval: 800,   act: 0, target: 6000,  dd: 2000, ddType: "static", minDays: 0 },
  { size: 150000, type: "Express to Live", eval: 1125,  act: 0, target: 9000,  dd: 3000, ddType: "static", minDays: 0 },

  // Fundamental — EOD drawdown, lifetime pricing
  { size: 50000,  type: "Fundamental", eval: 580,  act: 0, target: 3000,  dd: 2000, ddType: "eod",  minDays: 0 },
  { size: 100000, type: "Fundamental", eval: 723,  act: 0, target: 6000,  dd: 3000, ddType: "eod",  minDays: 0 },
  { size: 150000, type: "Fundamental", eval: 863,  act: 0, target: 9000,  dd: 4500, ddType: "eod",  minDays: 0 },

  // Premium — EOD drawdown, lifetime pricing
  { size: 50000,  type: "Premium", eval: 723,   act: 0, target: 3000,  dd: 2000, ddType: "eod",  minDays: 0 },
  { size: 100000, type: "Premium", eval: 900,   act: 0, target: 6000,  dd: 3000, ddType: "eod",  minDays: 0 },
  { size: 150000, type: "Premium", eval: 1123,  act: 0, target: 9000,  dd: 4500, ddType: "eod",  minDays: 0 },
];

async function scrape() {
  // Phidias has Cloudflare protection; use known prices
  console.warn(`[phidias] Using known prices (site has Cloudflare protection)`);

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `phidias-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.size / 1000}K`,
    accountType: cfg.type,
    drawdownType: cfg.ddType,
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: 80,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: true,
    payoutFrequency: null,
    maxFundedAccounts: 1,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: null,
    consistencyFundedPct: null,
    priceSource: 'verified',
    priceVerified: true,
  }));
}

module.exports = { scrape };
