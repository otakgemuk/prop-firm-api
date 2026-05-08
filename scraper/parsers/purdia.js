// Purdia Capital parser — Pro, EOD, Beginner, Instant Funding
const { buildPlan } = require("../utils");

const FIRM = {
  firmId: "purdia",
  firmName: "Purdia Capital",
  firmSlug: "purdia",
  websiteUrl: "https://purdia.com",
  trustpilot: null,
};

// Known RETAIL prices (verified May 2026)
const KNOWN = [
  // Pro Evaluation — trailing drawdown, 90% split
  { size: 100000, type: "Pro",       eval: 329, act: 0, target: 6000,  dd: 3000, ddType: "trailing", minDays: 5, profitSplit: 90 },

  // EOD Evaluation — end-of-day drawdown, 90% split
  { size: 50000,  type: "EOD",       eval: 309, act: 0, target: 3000,  dd: 2000, ddType: "eod",      minDays: 5, profitSplit: 90 },
  { size: 100000, type: "EOD",       eval: 429, act: 0, target: 6000,  dd: 3000, ddType: "eod",      minDays: 5, profitSplit: 90 },

  // Beginner Evaluation — trailing drawdown, 70% split
  { size: 25000,  type: "Beginner",  eval: 119, act: 0, target: 2000,  dd: 2000, ddType: "trailing", minDays: 5, profitSplit: 70 },

  // Instant Funding — trailing drawdown, 90% split, one-time
  { size: 50000,  type: "Instant",   eval: 549, act: 0, target: null,   dd: 1500, ddType: "trailing", minDays: 10, profitSplit: 90, isOneTime: true },
  { size: 100000, type: "Instant",   eval: 849, act: 0, target: null,   dd: 3000, ddType: "trailing", minDays: 10, profitSplit: 90, isOneTime: true },
];

async function scrape() {
  console.warn(`[purdia] Using known prices`);

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `purdia-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.size / 1000}K`,
    accountType: cfg.type,
    drawdownType: cfg.ddType,
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: cfg.profitSplit,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: cfg.isOneTime || false,
    payoutFrequency: null,
    discountPct: 0,
    maxFundedAccounts: 1,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: null,
    consistencyFundedPct: null,
    priceSource: 'verified',
    priceVerified: true,
  }));
}

module.exports = { scrape };
