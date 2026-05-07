// Phidias Propfirm parser — Express to Live, Fundamental, Premium, OTP types
// Lifetime (one-time) pricing, no monthly fees
const { buildPlan } = require("../utils");

const FIRM = {
  firmId: "phidias",
  firmName: "Phidias Propfirm",
  firmSlug: "phidias",
  websiteUrl: "https://phidiaspropfirm.com",
  trustpilot: 4,
};

// Known RETAIL prices (verified May 2026)
const KNOWN = [
  // Express to Live — static drawdown, lifetime pricing, 50% discount on 25K
  { size: 25000,  type: "Express to Live", eval: 277,  act: 0, target: 1500, dd: 500,  ddType: "static", minDays: 0, discount: 50 },
  { size: 50000,  type: "Express to Live", eval: 723,  act: 0, target: 3000, dd: 1000, ddType: "static", minDays: 0, discount: 0 },
  { size: 100000, type: "Express to Live", eval: 800,  act: 0, target: 6000, dd: 2000, ddType: "static", minDays: 0, discount: 0 },
  { size: 150000, type: "Express to Live", eval: 1125, act: 0, target: 9000, dd: 3000, ddType: "static", minDays: 0, discount: 0 },

  // Fundamental — EOD drawdown, lifetime pricing, 60% discount
  { size: 50000,  type: "Fundamental", eval: 580, act: 0, target: 3000, dd: 2000, ddType: "eod", minDays: 0, discount: 60 },
  { size: 100000, type: "Fundamental", eval: 723, act: 0, target: 6000, dd: 3000, ddType: "eod", minDays: 0, discount: 60 },
  { size: 150000, type: "Fundamental", eval: 863, act: 0, target: 9000, dd: 4500, ddType: "eod", minDays: 0, discount: 60 },

  // Premium — EOD drawdown, lifetime pricing, no discount
  { size: 50000,  type: "Premium", eval: 723,  act: 0, target: 3000, dd: 2000, ddType: "eod", minDays: 0, discount: 0 },
  { size: 100000, type: "Premium", eval: 900,  act: 0, target: 6000, dd: 3000, ddType: "eod", minDays: 0, discount: 0 },
  { size: 150000, type: "Premium", eval: 1123, act: 0, target: 9000, dd: 4500, ddType: "eod", minDays: 0, discount: 0 },

  // OTP (One-Time Payment) — EOD drawdown, 80% discount
  { size: 50000,  type: "OTP", eval: 723,  act: 0, target: 3000, dd: 2000, ddType: "eod", minDays: 0, discount: 80 },
  { size: 100000, type: "OTP", eval: 900,  act: 0, target: 6000, dd: 3000, ddType: "eod", minDays: 0, discount: 80 },
  { size: 150000, type: "OTP", eval: 1123, act: 0, target: 9000, dd: 4500, ddType: "eod", minDays: 0, discount: 80 },
];

async function scrape() {
  console.warn(`[phidias] Using known prices (site has Cloudflare protection)`);

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `phidias-${cfg.type.toLowerCase().replace(/\s+/g, "-")}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.size / 1000}K`,
    accountType: cfg.type,
    drawdownType: cfg.ddType,
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: 80,
    evalFee: cfg.eval,
    retailEvalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: true,
    payoutFrequency: null,
    discountPct: cfg.discount,
    maxFundedAccounts: 1,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: null,
    consistencyFundedPct: null,
    priceSource: "verified",
    priceVerified: true,
  }));
}

module.exports = { scrape };
