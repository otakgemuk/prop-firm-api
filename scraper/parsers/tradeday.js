// TradeDay parser — EOD, Intraday, Static types
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f04", firmName: "TradeDay", firmSlug: "tradeday", websiteUrl: "https://tradeday.com", trustpilot: 4.6 };

// Known prices (verified May 2026)
const KNOWN = [
  { size: 50000,  type: "EOD",      eval: 175, act: 139, target: 3000, dd: 2000 },
  { size: 50000,  type: "Intraday", eval: 125, act: 139, target: 3000, dd: 2000 },
  { size: 50000,  type: "Static",   eval: 165, act: 139, target: 2500, dd: 2000 },
  { size: 100000, type: "EOD",      eval: 275, act: 139, target: 6000, dd: 3000 },
  { size: 100000, type: "Intraday", eval: 200, act: 139, target: 6000, dd: 3000 },
  { size: 100000, type: "Static",   eval: 265, act: 139, target: 5000, dd: 3000 },
  { size: 150000, type: "EOD",      eval: 375, act: 139, target: 9000, dd: 4000 },
  { size: 150000, type: "Intraday", eval: 300, act: 139, target: 9000, dd: 4000 },
  { size: 150000, type: "Static",   eval: 360, act: 139, target: 7500, dd: 4000 },
];

const DD_TYPES = { "EOD": "eod", "Intraday": "intraday", "Static": "static" };

async function scrape() {
  const html = await fetchRendered("https://tradeday.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 1;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 30;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `tradeday-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.size / 1000}K`,
    accountType: cfg.type,
    drawdownType: DD_TYPES[cfg.type] || "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: maxFunded,
    minTradingDays: 5,
    consistencyEvalPct,
    consistencyFundedPct: null,
  }));
}

module.exports = { scrape };
