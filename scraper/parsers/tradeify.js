// Tradeify parser — Growth, Lightning, Select types
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
const KNOWN = [
  { size: 25000,  type: "Growth",    eval: 59,  target: 1500, dd: 1000, minDays: 1,  consFund: 35 },
  { size: 25000,  type: "Lightning", eval: 197, target: 1500, dd: 1000, minDays: 5,  consFund: 20 },
  { size: 25000,  type: "Select",    eval: 65,  target: 1500, dd: 1000, minDays: 3,  consEval: 40 },
  { size: 50000,  type: "Growth",    eval: 87,  target: 3000, dd: 2000, minDays: 1,  consFund: 35 },
  { size: 50000,  type: "Lightning", eval: 281, target: 3000, dd: 2000, minDays: 5,  consFund: 20 },
  { size: 50000,  type: "Select",    eval: 99,  target: 3000, dd: 2000, minDays: 3,  consEval: 40 },
  { size: 100000, type: "Growth",    eval: 153, target: 6000, dd: 3500, minDays: 1,  consFund: 35 },
  { size: 100000, type: "Lightning", eval: 377, target: 6000, dd: 4000, minDays: 5,  consFund: 20 },
  { size: 100000, type: "Select",    eval: 159, target: 6000, dd: 3000, minDays: 3,  consEval: 40 },
  { size: 150000, type: "Growth",    eval: 221, target: 9000, dd: 5000, minDays: 1,  consFund: 35 },
  { size: 150000, type: "Lightning", eval: 455, target: 9000, dd: 5250, minDays: 5,  consFund: 20 },
  { size: 150000, type: "Select",    eval: 221, target: 9000, dd: 4500, minDays: 3,  consEval: 40 },
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
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: 0,
    isOneTime: cfg.type === "Growth",
    payoutFrequency: cfg.type === "Growth" ? null : cfg.type === "Lightning" ? null : "weekly",
    maxFundedAccounts: maxFunded,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: cfg.consEval || null,
    consistencyFundedPct: cfg.consFund || null,
  }));
}

module.exports = { scrape };
