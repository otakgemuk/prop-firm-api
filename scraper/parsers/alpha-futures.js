// Alpha Futures parser — Zero, Advanced, Premium types
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
// TODO: Currently returns hardcoded prices. Implement live price extraction.
// See topstep.js for reference implementation.

const cheerio = require("cheerio");

const FIRM = {
  firmId: "f10",
  firmName: "Alpha Futures",
  firmSlug: "alpha-futures",
  websiteUrl: "https://alpha-futures.com",
  trustpilot: 4.7,
};

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  type: "Zero",             eval: 79,  act: 0,   target: 1500,  dd: 1000, minDays: 1, consFund: 40 },
  { size: 50000,  type: "Advanced",         eval: 139, act: 149, target: 4000,  dd: 1750, minDays: 2 },
  { size: 50000,  type: "Premium",          eval: 79,  act: 149, target: 3000,  dd: 2000, minDays: 2, consEval: 50, consFund: 40 },
  { size: 50000,  type: "Premium (No Act)", eval: 149, act: 0,   target: 3000,  dd: 2000, minDays: 2, consEval: 50, consFund: 40 },
  { size: 50000,  type: "Zero",             eval: 119, act: 0,   target: 3000,  dd: 2000, minDays: 1, consFund: 40 },
  { size: 100000, type: "Advanced",         eval: 279, act: 149, target: 8000,  dd: 3500, minDays: 2 },
  { size: 100000, type: "Premium",          eval: 159, act: 149, target: 6000,  dd: 4000, minDays: 2, consEval: 50, consFund: 40 },
  { size: 100000, type: "Premium (No Act)", eval: 239, act: 0,   target: 6000,  dd: 4000, minDays: 2, consEval: 50, consFund: 40 },
  { size: 100000, type: "Zero",             eval: 239, act: 0,   target: 6000,  dd: 4000, minDays: 1, consFund: 40 },
  { size: 150000, type: "Advanced",         eval: 419, act: 149, target: 12000, dd: 5250, minDays: 2 },
  { size: 150000, type: "Premium",          eval: 239, act: 149, target: 9000,  dd: 6000, minDays: 2, consEval: 50, consFund: 40 },
  { size: 150000, type: "Premium (No Act)", eval: 329, act: 0,   target: 9000,  dd: 6000, minDays: 2, consEval: 50, consFund: 40 },
];

async function scrape() {
  const html = await fetchRendered("https://alpha-futures.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 1;

  return KNOWN.map(cfg => {
    const slug = cfg.type.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return buildPlan({
      ...FIRM,
      planId: `alpha-${slug}-${cfg.size / 1000}k`,
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
      maxFundedAccounts: maxFunded,
      minTradingDays: cfg.minDays,
      consistencyEvalPct: cfg.consEval || null,
      consistencyFundedPct: cfg.consFund || null,
    });
  });
}

module.exports = { scrape };
