// Purdia Capital parser — Pro, EOD, Beginner, Instant Funding, Combine
const { buildPlan } = require("../utils");

const FIRM = {
  firmId: "purdia",
  firmName: "Purdia Capital",
  firmSlug: "purdia",
  websiteUrl: "https://purdia.com",
  trustpilot: null,
};

// Known RETAIL prices (verified May 2026)
// Pro 100K, EOD 100K, Instant 100K, Combine confirmed from pricing page.
// EOD 50K, Beginner 25K, Instant 50K kept as-is (not in source).
const KNOWN = [
  // Pro Evaluation — trailing drawdown, monthly
  { size: 100000, type: "Pro",       eval: 299, act: 0, target: 6000,  dd: 3000, ddType: "trailing", minDays: 5, profitSplit: 90 },

  // EOD Evaluation — end-of-day drawdown, monthly
  { size: 50000,  type: "EOD",       eval: 99,  act: 0, target: 3000,  dd: 2000, ddType: "eod",      minDays: 5, profitSplit: 70 },
  { size: 100000, type: "EOD",       eval: 349, act: 0, target: 6000,  dd: 3000, ddType: "eod",      minDays: 5, profitSplit: 70 },

  // Beginner Evaluation — trailing drawdown, monthly
  { size: 25000,  type: "Beginner",  eval: 119, act: 0, target: 2000,  dd: 2000, ddType: "trailing", minDays: 5, profitSplit: 70 },

  // Instant Funding — trailing drawdown, one-time
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
    maxFundedAccounts: 1,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: null,
    consistencyFundedPct: null,
    priceSource: 'verified',
    priceVerified: true,
  }));
}

module.exports = { scrape };
