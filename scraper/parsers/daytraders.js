// DayTraders parser
// Account types: S2F, Static, Trail, S2L
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "daytraders",
  firmName: "DayTraders",
  firmSlug: "daytraders",
  websiteUrl: null,
  trustpilot: null,
};

// Known prices (verified May 2026)
const KNOWN = [
  { key: "S2F-25K",     size: 25000,  type: "S2F",          label: "S2F 25K",          eval: 222, act: 0,   target: null,  dd: 1000, ddType: "eod",    maxAcct: 3,  minDays: 10, consEval: null, consFund: 20 },
  { key: "S2F-50K",     size: 50000,  type: "S2F",          label: "S2F 50K",          eval: 342, act: 0,   target: null,  dd: 2500, ddType: "eod",    maxAcct: 3,  minDays: 10, consEval: null, consFund: 20 },
  { key: "S2F-150K",    size: 150000, type: "S2F",          label: "S2F 150K",         eval: 495, act: 0,   target: null,  dd: 6000, ddType: "eod",    maxAcct: 3,  minDays: 10, consEval: null, consFund: 20 },
  { key: "Static-25K",  size: 25000,  type: "Static",       label: "Static 25K",       eval: 30,  act: 130, target: 2500,  dd: 750,  ddType: "static", maxAcct: 5,  minDays: 2,  consEval: 50,   consFund: 30 },
  { key: "Static-50K",  size: 50000,  type: "Static",       label: "Static 50K",       eval: 40,  act: 130, target: 3750,  dd: 1000, ddType: "static", maxAcct: 5,  minDays: 2,  consEval: 50,   consFund: 30 },
  { key: "Static-100K", size: 100000, type: "Static",       label: "Static 100K",      eval: 65,  act: 130, target: 5750,  dd: 1500, ddType: "static", maxAcct: 5,  minDays: 2,  consEval: 50,   consFund: 30 },
  { key: "Trail-25K",   size: 25000,  type: "Trail",        label: "Trail 25K",        eval: 37,  act: 130, target: 1500,  dd: 1500, ddType: "eod",    maxAcct: 5,  minDays: 2,  consEval: 50,   consFund: 30 },
  { key: "Trail-50K",   size: 50000,  type: "Trail",        label: "Trail 50K",        eval: 57,  act: 130, target: 3000,  dd: 2500, ddType: "eod",    maxAcct: 5,  minDays: 2,  consEval: 50,   consFund: 30 },
  { key: "Trail-100K",  size: 100000, type: "Trail",        label: "Trail 100K",       eval: 85,  act: 130, target: 6000,  dd: 3000, ddType: "eod",    maxAcct: 5,  minDays: 2,  consEval: 50,   consFund: 30 },
  { key: "S2L-50K",     size: 50000,  type: "S2L 50K Core", label: "S2L 50K Core",    eval: 229, act: 0,   target: 3000,  dd: 2000, ddType: "eod",    maxAcct: 5,  minDays: 8,  consEval: 25,   consFund: null },
  { key: "S2L-150K",    size: 150000, type: "S2L 150K Edge",label: "S2L 150K Edge",   eval: 369, act: 0,   target: 8500,  dd: 4500, ddType: "eod",    maxAcct: 5,  minDays: 8,  consEval: 25,   consFund: null },
  { key: "S2L-300K",    size: 300000, type: "S2L 300K Ultra",label: "S2L 300K Ultra", eval: 499, act: 0,   target: 15000, dd: 7000, ddType: "eod",    maxAcct: 5,  minDays: 8,  consEval: 25,   consFund: null },
];

async function scrape() {
  // Site is JS-rendered; use known prices as primary source
  try {
    const html = await fetchRendered("https://daytraders.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    // If we can extract live data in the future, do it here
  } catch (e) {
    console.warn(`[daytraders] Live scrape failed, using known prices: ${e.message}`);
  }

  return buildFromKnown();
}

function buildFromKnown() {
  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `daytraders-${cfg.key.toLowerCase()}`,
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
    isOneTime: true,
    payoutFrequency: null,
    maxFundedAccounts: cfg.maxAcct,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: cfg.consEval,
    consistencyFundedPct: cfg.consFund,
  }));
}

module.exports = { scrape };
