// Lucid Trading parser — LucidFlex, LucidPro, S2F types
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f05", firmName: "Lucid Trading", firmSlug: "lucid-trading", websiteUrl: "https://lucidtrading.com", trustpilot: 4.2 };

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  type: "LucidFlex", eval: 60,  target: 1250, dd: 1000, minDays: 2, consFund: null },
  { size: 25000,  type: "LucidPro",  eval: 81,  target: 1250, dd: 1000, minDays: 1, consFund: 40 },
  { size: 25000,  type: "S2F",       eval: 238, target: 1500, dd: 1000, minDays: 5, consFund: 20 },
  { size: 50000,  type: "LucidFlex", eval: 84,  target: 3000, dd: 2000, minDays: 2, consFund: null },
  { size: 50000,  type: "LucidPro",  eval: 111, target: 3000, dd: 2000, minDays: 1, consFund: 40 },
  { size: 50000,  type: "S2F",       eval: 364, target: 3000, dd: 2000, minDays: 5, consFund: 20 },
  { size: 100000, type: "LucidFlex", eval: 135, target: 6000, dd: 3000, minDays: 2, consFund: null },
  { size: 100000, type: "LucidPro",  eval: 171, target: 6000, dd: 3000, minDays: 1, consFund: 40 },
  { size: 100000, type: "S2F",       eval: 490, target: 6000, dd: 3500, minDays: 5, consFund: 20 },
  { size: 150000, type: "LucidFlex", eval: 252, target: 9000, dd: 4500, minDays: 2, consFund: null },
  { size: 150000, type: "LucidPro",  eval: 222, target: 9000, dd: 4500, minDays: 1, consFund: 40 },
  { size: 150000, type: "S2F",       eval: 588, target: 9000, dd: 5000, minDays: 5, consFund: 20 },
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
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: 0,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: maxFunded,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: null,
    consistencyFundedPct: cfg.consFund,
  }));
}

module.exports = { scrape };
