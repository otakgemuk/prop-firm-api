// Elite Trader Funding parser
// Types: 1-Step, Fast Track, Static, DTF, EOD, DH
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f08",
  firmName: "Elite Trader Funding",
  firmSlug: "elite-trader-funding",
  websiteUrl: "https://elitetraderfunding.com",
  trustpilot: 4.3,
};

// Known prices (verified May 2026)
const KNOWN = [
  { size: 10000,  type: "Static",      label: "Static 10K",      eval: 99,  act: 87,  target: 600,   dd: 500,  ddType: "static", maxAcct: 1,  minDays: 5, consEval: 30 },
  { size: 50000,  type: "1-Step",      label: "1-Step 50K",      eval: 165, act: 87,  target: 3000,  dd: 2000, ddType: "intraday", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 50000,  type: "DTF",         label: "DTF 50K",         eval: 599, act: 47,  target: 2500,  dd: 2500, ddType: "eod", maxAcct: 5, minDays: 1 },
  { size: 50000,  type: "EOD",         label: "EOD 50K",         eval: 295, act: 87,  target: 3000,  dd: 2000, ddType: "eod", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 50000,  type: "Static",      label: "Static 50K",      eval: 449, act: 87,  target: 2400,  dd: 2000, ddType: "static", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 100000, type: "1-Step",      label: "1-Step 100K",     eval: 205, act: 87,  target: 6000,  dd: 3000, ddType: "intraday", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 100000, type: "DH",          label: "DH 100K",         eval: 365, act: 87,  target: 5000,  dd: 3500, ddType: "eod", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 100000, type: "DTF",         label: "DTF 100K",        eval: 649, act: 47,  target: 5000,  dd: 5000, ddType: "static", maxAcct: 5, minDays: 1 },
  { size: 100000, type: "EOD",         label: "EOD 100K",        eval: 355, act: 87,  target: 6000,  dd: 3500, ddType: "eod", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 100000, type: "Fast Track",  label: "Fast Track 100K", eval: 75,  act: 87,  target: 6000,  dd: 3000, ddType: "intraday", maxAcct: 1, minDays: 3, consEval: 40 },
  { size: 150000, type: "1-Step",      label: "1-Step 150K",     eval: 295, act: 87,  target: 9000,  dd: 5000, ddType: "intraday", maxAcct: 1, minDays: 5, consEval: 30 },
  { size: 250000, type: "1-Step",      label: "1-Step 250K",     eval: 515, act: 87,  target: 15000, dd: 6500, ddType: "intraday", maxAcct: 1, minDays: 5, consEval: 30 },
];

async function scrape() {
  const html = await fetchRendered("https://elitetraderfunding.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `etf-${cfg.type.toLowerCase().replace(/\s+/g, "-")}-${cfg.label.split(" ").pop()}`,
    accountSize: cfg.size,
    planLabel: cfg.label,
    accountType: cfg.type,
    drawdownType: cfg.ddType,
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: cfg.type === "Fast Track" || cfg.type === "DTF",
    payoutFrequency: null,
    maxFundedAccounts: cfg.maxAcct || maxFunded,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: cfg.consEval || null,
    consistencyFundedPct: null,
  }));
}

module.exports = { scrape };
