// Lucid Trading parser — LucidFlex, LucidPro, S2F (DirectS2F) types
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f05", firmName: "Lucid Trading", firmSlug: "lucid-trading", websiteUrl: "https://lucidtrading.com", trustpilot: 4.2 };

// Known prices (verified May 2026)
// LucidPro: 40% off base, 3-day payout, EOD, 90% split
// LucidFlex: 40% off base, 5-day payout, EOD, 90% split
// S2F (DirectS2F): 30% off base, 5-day payout, EOD, 90% split, no profit target
const KNOWN = [
  { size: 25000,  type: "LucidFlex", eval: 60,  retail: 100,  target: 1250, dd: 1000, minDays: 5, consEval: null,  discount: 40 },
  { size: 25000,  type: "LucidPro",  eval: 81,  retail: 135,  target: 1250, dd: 1000, minDays: 3, consEval: 40,    discount: 40 },
  { size: 25000,  type: "S2F",       eval: 238, retail: 340,  target: null, dd: 1000, minDays: 5, consEval: null,  discount: 30 },
  { size: 50000,  type: "LucidFlex", eval: 84,  retail: 140,  target: 3000, dd: 2000, minDays: 5, consEval: null,  discount: 40 },
  { size: 50000,  type: "LucidPro",  eval: 111, retail: 185,  target: 3000, dd: 2000, minDays: 3, consEval: 40,    discount: 40 },
  { size: 50000,  type: "S2F",       eval: 364, retail: 520,  target: null, dd: 2000, minDays: 5, consEval: null,  discount: 30 },
  { size: 100000, type: "LucidFlex", eval: 135, retail: 225,  target: 6000, dd: 3000, minDays: 5, consEval: null,  discount: 40 },
  { size: 100000, type: "LucidPro",  eval: 171, retail: 285,  target: 6000, dd: 3000, minDays: 3, consEval: 40,    discount: 40 },
  { size: 100000, type: "S2F",       eval: 490, retail: 700,  target: null, dd: 3500, minDays: 5, consEval: null,  discount: 30 },
  { size: 150000, type: "LucidFlex", eval: 252, retail: 420,  target: 9000, dd: 4500, minDays: 5, consEval: null,  discount: 40 },
  { size: 150000, type: "LucidPro",  eval: 222, retail: 370,  target: 9000, dd: 4500, minDays: 3, consEval: 40,    discount: 40 },
  { size: 150000, type: "S2F",       eval: 588, retail: 840,  target: null, dd: 5000, minDays: 5, consEval: null,  discount: 30 },
];

async function scrape() {
  const html = await fetchRendered("https://lucidtrading.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 1;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `lucid-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.size / 1000}K`,
    accountType: cfg.type,
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: 90,
    evalFee: cfg.eval,
    retailEvalFee: cfg.retail,
    activationFee: 0,
    isOneTime: false,
    payoutFrequency: null,
    discountPct: cfg.discount,
    maxFundedAccounts: maxFunded,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: cfg.consEval,
    consistencyFundedPct: null,
    priceSource: "manual",
    priceVerified: true,
  }));
}

module.exports = { scrape };
