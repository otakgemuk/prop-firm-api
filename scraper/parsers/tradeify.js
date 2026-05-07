// Tradeify parser — Growth, Lightning (S2F), Select types
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f11",
  firmName: "Tradeify",
  firmSlug: "tradeify",
  websiteUrl: "https://tradeify.co",
  trustpilot: 4.5,
};

// Known prices (verified May 2026)
// Growth: 40% off, 1-day payout, EOD, 90% split
// Lightning (S2F): no discount, 5-day payout, EOD, 90% split, no profit target
// Select: 40% off, weekly payout, EOD, 90% split
const KNOWN = [
  { size: 25000,  type: "Growth",    eval: 59,  retail: 99,   target: 1500, dd: 1000, minDays: 1,  consEval: null, consFund: 35, discount: 40 },
  { size: 25000,  type: "Lightning", eval: 345, retail: 345,  target: null, dd: 1000, minDays: 5,  consEval: null, consFund: 20, discount: 0 },
  { size: 25000,  type: "Select",    eval: 65,  retail: 109,  target: 1500, dd: 1000, minDays: 3,  consEval: 40,   consFund: null, discount: 40 },
  { size: 50000,  type: "Growth",    eval: 87,  retail: 145,  target: 3000, dd: 2000, minDays: 1,  consEval: null, consFund: 35, discount: 40 },
  { size: 50000,  type: "Lightning", eval: 492, retail: 492,  target: null, dd: 2000, minDays: 5,  consEval: null, consFund: 20, discount: 0 },
  { size: 50000,  type: "Select",    eval: 99,  retail: 165,  target: 3000, dd: 2000, minDays: 3,  consEval: 40,   consFund: null, discount: 40 },
  { size: 100000, type: "Growth",    eval: 153, retail: 255,  target: 6000, dd: 3500, minDays: 1,  consEval: null, consFund: 35, discount: 40 },
  { size: 100000, type: "Lightning", eval: 660, retail: 660,  target: null, dd: 4000, minDays: 5,  consEval: null, consFund: 20, discount: 0 },
  { size: 100000, type: "Select",    eval: 159, retail: 265,  target: 6000, dd: 3000, minDays: 3,  consEval: 40,   consFund: null, discount: 40 },
  { size: 150000, type: "Growth",    eval: 221, retail: 369,  target: 9000, dd: 5000, minDays: 1,  consEval: null, consFund: 35, discount: 40 },
  { size: 150000, type: "Lightning", eval: 796, retail: 796,  target: null, dd: 5250, minDays: 5,  consEval: null, consFund: 20, discount: 0 },
  { size: 150000, type: "Select",    eval: 221, retail: 369,  target: 9000, dd: 4500, minDays: 3,  consEval: 40,   consFund: null, discount: 40 },
];

async function scrape() {
  let html;
  try {
    html = await fetchRendered("https://tradeify.co", { waitFor: 5000 });
  } catch (e) {
    const res = await fetch("https://tradeify.co", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    html = await res.text();
  }

  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 1;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `tradeify-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.size / 1000}K ${cfg.type}`,
    accountType: cfg.type,
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: 90,
    evalFee: cfg.eval,
    retailEvalFee: cfg.retail,
    activationFee: 0,
    isOneTime: cfg.type === "Growth",
    payoutFrequency: cfg.type === "Select" ? "weekly" : "biweekly",
    discountPct: cfg.discount,
    maxFundedAccounts: maxFunded,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: cfg.consEval,
    consistencyFundedPct: cfg.consFund,
    priceSource: "manual",
    priceVerified: true,
  }));
}

module.exports = { scrape };
