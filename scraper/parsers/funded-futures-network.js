// Funded Futures Network parser
// Standard/Express × OG/MAX across 5 account sizes
//
// OG = Intraday Realized Trailing Drawdown
//   Standard OG: 7-day min, 40% consistency
//   Express OG: 4-day min, 40% consistency
// MAX = Direct to Funded
//   Standard MAX: EOD Drawdown, 5-day min, 40% consistency
//   Express MAX: Unrealized Trailing, 2-day min, 25% consistency (50% for 150K/250K)
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "funded_futures_n",
  firmName: "Funded Futures Network",
  firmSlug: "funded-futures-network",
  websiteUrl: "https://fundedfuturesnetwork.com",
  trustpilot: null,
};

// Known RETAIL prices (verified May 2026)
// Prices differ by type (OG vs MAX have different prices)
const PLANS = [
  // Standard OG — $125/$150/$305/$350/$580
  { size: 25000,  type: "Standard OG",  eval: 125, target: 2000,  dd: 1500, ddType: "intraday", minDays: 7,  consEval: 40 },
  { size: 50000,  type: "Standard OG",  eval: 150, target: 3000,  dd: 2000, ddType: "intraday", minDays: 7,  consEval: 40 },
  { size: 100000, type: "Standard OG",  eval: 305, target: 6000,  dd: 3600, ddType: "intraday", minDays: 7,  consEval: 40 },
  { size: 150000, type: "Standard OG",  eval: 350, target: 9000,  dd: 5000, ddType: "intraday", minDays: 7,  consEval: 40 },
  { size: 250000, type: "Standard OG",  eval: 580, target: 15000, dd: 6000, ddType: "intraday", minDays: 7,  consEval: 40 },
  // Express OG — $155/$175/$330/$380/$690
  { size: 25000,  type: "Express OG",   eval: 155, target: 2000,  dd: 1500, ddType: "intraday", minDays: 4,  consEval: 40 },
  { size: 50000,  type: "Express OG",   eval: 175, target: 3000,  dd: 2000, ddType: "intraday", minDays: 4,  consEval: 40 },
  { size: 100000, type: "Express OG",   eval: 330, target: 6000,  dd: 3600, ddType: "intraday", minDays: 4,  consEval: 40 },
  { size: 150000, type: "Express OG",   eval: 380, target: 9000,  dd: 5000, ddType: "intraday", minDays: 4,  consEval: 40 },
  { size: 250000, type: "Express OG",   eval: 690, target: 15000, dd: 6000, ddType: "intraday", minDays: 4,  consEval: 40 },
  // Standard MAX — $135/$160/$315/$365/$590 (EOD)
  { size: 25000,  type: "Standard MAX", eval: 135, target: 2000,  dd: 1500, ddType: "eod",      minDays: 5,  consEval: 40 },
  { size: 50000,  type: "Standard MAX", eval: 160, target: 3000,  dd: 2000, ddType: "eod",      minDays: 5,  consEval: 40 },
  { size: 100000, type: "Standard MAX", eval: 315, target: 6000,  dd: 3600, ddType: "eod",      minDays: 5,  consEval: 40 },
  { size: 150000, type: "Standard MAX", eval: 365, target: 9000,  dd: 5000, ddType: "eod",      minDays: 5,  consEval: 40 },
  { size: 250000, type: "Standard MAX", eval: 590, target: 15000, dd: 6000, ddType: "eod",      minDays: 5,  consEval: 40 },
  // Express MAX — $165/$185/$340/$395/$720 (Unrealized Trailing)
  { size: 25000,  type: "Express MAX",  eval: 165, target: 2000,  dd: 1500, ddType: "intraday", minDays: 2,  consEval: 25 },
  { size: 50000,  type: "Express MAX",  eval: 185, target: 3000,  dd: 2000, ddType: "intraday", minDays: 2,  consEval: 25 },
  { size: 100000, type: "Express MAX",  eval: 340, target: 6000,  dd: 3600, ddType: "intraday", minDays: 2,  consEval: 25 },
  { size: 150000, type: "Express MAX",  eval: 395, target: 9000,  dd: 5000, ddType: "intraday", minDays: 2,  consEval: 50 },
  { size: 250000, type: "Express MAX",  eval: 720, target: 15000, dd: 6000, ddType: "intraday", minDays: 2,  consEval: 50 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://fundedfuturesnetwork.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
  } catch (e) {
    console.warn(`[funded-futures-network] Live scrape failed, using known prices: ${e.message}`);
  }

  return PLANS.map(cfg => {
    const slug = cfg.type.toLowerCase().replace(/\s+/g, "-");
    return buildPlan({
      ...FIRM,
      planId: `ffn-${slug}-${cfg.size / 1000}k`,
      accountSize: cfg.size,
      planLabel: `${cfg.type} ${cfg.size / 1000}K`,
      accountType: cfg.type,
      drawdownType: cfg.ddType,
      drawdownAmount: cfg.dd,
      dailyLossLimit: null,
      profitTarget: cfg.target,
      profitSplit: null,
      evalFee: cfg.eval,
      retailEvalFee: cfg.eval,
      activationFee: 0,
      isOneTime: false,
      payoutFrequency: "biweekly",
      discountPct: 50,
      maxFundedAccounts: 10,
      minTradingDays: cfg.minDays,
      consistencyEvalPct: cfg.consEval,
      consistencyFundedPct: null,
      priceSource: "manual",
      priceVerified: true,
    });
  });
}

module.exports = { scrape };
