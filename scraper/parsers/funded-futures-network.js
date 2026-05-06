// Funded Futures Network parser
// Standard/Express × OG/MAX across 5 account sizes
// TODO: Currently returns hardcoded prices. Implement live price extraction.
// See topstep.js for reference implementation.

const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "funded_futures_n",
  firmName: "Funded Futures Network",
  firmSlug: "funded-futures-network",
  websiteUrl: "https://fundedfuturesnetwork.com",
  trustpilot: null,
};

// Known prices (verified May 2026)
const KNOWN = [
  // Standard OG
  { size: 25000,  type: "Standard OG",  eval: 68,  act: 50,  target: 1500,  dd: 1500,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 50000,  type: "Standard OG",  eval: 80,  act: 50,  target: 3000,  dd: 2000,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 100000, type: "Standard OG",  eval: 158, act: 100, target: 6000,  dd: 3600,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 150000, type: "Standard OG",  eval: 183, act: 100, target: 9000,  dd: 4500,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 250000, type: "Standard OG",  eval: 295, act: 100, target: 15000, dd: 6500,  maxAcct: 10, minDays: 15, consEval: 40 },
  // Standard MAX
  { size: 25000,  type: "Standard MAX", eval: 135, act: 50,  target: 1500,  dd: 1500,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 50000,  type: "Standard MAX", eval: 160, act: 50,  target: 3000,  dd: 2000,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 100000, type: "Standard MAX", eval: 315, act: 100, target: 6000,  dd: 3600,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 150000, type: "Standard MAX", eval: 365, act: 100, target: 9000,  dd: 4500,  maxAcct: 10, minDays: 15, consEval: 40 },
  { size: 250000, type: "Standard MAX", eval: 590, act: 100, target: 15000, dd: 6500,  maxAcct: 10, minDays: 15, consEval: 40 },
  // Express OG
  { size: 25000,  type: "Express OG",   eval: 75,  act: 50,  target: 1500,  dd: 1500,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 50000,  type: "Express OG",   eval: 80,  act: 50,  target: 3000,  dd: 2000,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 100000, type: "Express OG",   eval: 158, act: 100, target: 6000,  dd: 3600,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 150000, type: "Express OG",   eval: 183, act: 100, target: 9000,  dd: 4500,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 250000, type: "Express OG",   eval: 295, act: 100, target: 15000, dd: 6500,  maxAcct: 10, minDays: 7,  consEval: 15 },
  // Express MAX
  { size: 25000,  type: "Express MAX",  eval: 270, act: 50,  target: 1500,  dd: 1500,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 50000,  type: "Express MAX",  eval: 320, act: 50,  target: 3000,  dd: 2000,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 100000, type: "Express MAX",  eval: 630, act: 100, target: 6000,  dd: 3600,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 150000, type: "Express MAX",  eval: 730, act: 100, target: 9000,  dd: 4500,  maxAcct: 10, minDays: 7,  consEval: 15 },
  { size: 250000, type: "Express MAX",  eval: 1180,act: 100, target: 15000, dd: 6500,  maxAcct: 10, minDays: 7,  consEval: 15 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://fundedfuturesnetwork.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    // Future: extract live prices
  } catch (e) {
    console.warn(`[funded-futures-network] Live scrape failed, using known prices: ${e.message}`);
  }

  return KNOWN.map(cfg => {
    const slug = cfg.type.toLowerCase().replace(/\s+/g, "-");
    return buildPlan({
      ...FIRM,
      planId: `ffn-${slug}-${cfg.size / 1000}k`,
      accountSize: cfg.size,
      planLabel: `${cfg.type} ${cfg.size / 1000}K`,
      accountType: cfg.type,
      drawdownType: "intraday",
      drawdownAmount: cfg.dd,
      dailyLossLimit: null,
      profitTarget: cfg.target,
      profitSplit: null,
      evalFee: cfg.eval,
      activationFee: cfg.act,
      isOneTime: false,
      payoutFrequency: null,
      maxFundedAccounts: cfg.maxAcct,
      minTradingDays: cfg.minDays,
      consistencyEvalPct: cfg.consEval,
      consistencyFundedPct: null,
    });
  });
}

module.exports = { scrape };
