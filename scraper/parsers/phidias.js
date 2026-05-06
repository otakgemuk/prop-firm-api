// Phidias Propfirm parser — Fundamental, Swing, Static account types
// Lifetime (one-time) pricing, no monthly fees
const { buildPlan } = require("../utils");

const FIRM = {
  firmId: "phidias",
  firmName: "Phidias Propfirm",
  firmSlug: "phidias",
  websiteUrl: "https://phidiaspropfirm.com",
  trustpilot: null,
};

// Known prices (verified from help center + user data, May 2026)
const KNOWN = [
  // Fundamental — trailing drawdown, lifetime pricing
  { size: 25000,  type: "Fundamental", eval: 162, act: 0, target: 1500,  dd: 1000, ddType: "eod",     minDays: 0 },
  { size: 50000,  type: "Fundamental", eval: 149, act: 0, target: 3000,  dd: 2000, ddType: "eod",     minDays: 0 },
  { size: 100000, type: "Fundamental", eval: 149, act: 0, target: 6000,  dd: 3000, ddType: "eod",     minDays: 0 },
  { size: 150000, type: "Fundamental", eval: 169, act: 0, target: 9000,  dd: 4500, ddType: "eod",     minDays: 0 },

  // Swing — EOD drawdown, lifetime pricing
  { size: 25000,  type: "Swing", eval: 162, act: 0, target: 1500,  dd: 1000, ddType: "eod",     minDays: 0 },
  { size: 50000,  type: "Swing", eval: 149, act: 0, target: 3000,  dd: 2000, ddType: "eod",     minDays: 0 },
  { size: 100000, type: "Swing", eval: 149, act: 0, target: 6000,  dd: 3000, ddType: "eod",     minDays: 0 },
  { size: 150000, type: "Swing", eval: 169, act: 0, target: 9000,  dd: 4500, ddType: "eod",     minDays: 0 },

  // Static — static drawdown, lifetime pricing
  { size: 25000,  type: "Static", eval: 83,  act: 0, target: 1500,  dd: 500,  ddType: "static",  minDays: 0 },
  { size: 50000,  type: "Static", eval: 116, act: 0, target: 3000,  dd: 1000, ddType: "static",  minDays: 0 },
  { size: 100000, type: "Static", eval: 149, act: 0, target: 6000,  dd: 2000, ddType: "static",  minDays: 0 },
  { size: 150000, type: "Static", eval: 169, act: 0, target: 9000,  dd: 3000, ddType: "static",  minDays: 0 },

  // One-Time Payment (OTP) — Evaluation + CASH account bundle
  { size: 25000,  type: "OTP", eval: 277, act: 0, target: 1500,  dd: 1000, ddType: "eod",     minDays: 0 },
  { size: 50000,  type: "OTP", eval: 377, act: 0, target: 3000,  dd: 2000, ddType: "eod",     minDays: 0 },
  { size: 100000, type: "OTP", eval: 477, act: 0, target: 6000,  dd: 3000, ddType: "eod",     minDays: 0 },
  { size: 150000, type: "OTP", eval: 577, act: 0, target: 9000,  dd: 4500, ddType: "eod",     minDays: 0 },
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
  }));
}

module.exports = { scrape };
