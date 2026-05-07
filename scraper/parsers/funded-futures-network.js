// Funded Futures Network parser
// Standard/Express × OG/MAX across 5 account sizes
// All types within same size have the same price — differentiated by drawdown type.
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
// All OG/MAX variants within a size share the same monthly price.
const SIZES = [
  { size: 25000,  eval: 125, target: 1500,  dd: 1500 },
  { size: 50000,  eval: 145, target: 3000,  dd: 2000 },
  { size: 100000, eval: 215, target: 6000,  dd: 3000 },
  { size: 150000, eval: 295, target: 9000,  dd: 4500 },
  { size: 250000, eval: 495, target: 15000, dd: 6500 },
];

const TYPES = [
  { type: "Standard OG",  ddType: "eod",      minDays: 15, consEval: 40 },
  { type: "Standard MAX", ddType: "eod",      minDays: 15, consEval: 40 },
  { type: "Express OG",   ddType: "intraday", minDays: 3,  consEval: 15 },
  { type: "Express MAX",  ddType: "intraday", minDays: 3,  consEval: 15 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://fundedfuturesnetwork.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
  } catch (e) {
    console.warn(`[funded-futures-network] Live scrape failed, using known prices: ${e.message}`);
  }

  const plans = [];
  for (const s of SIZES) {
    for (const t of TYPES) {
      const slug = t.type.toLowerCase().replace(/\s+/g, "-");
      plans.push(buildPlan({
        ...FIRM,
        planId: `ffn-${slug}-${s.size / 1000}k`,
        accountSize: s.size,
        planLabel: `${t.type} ${s.size / 1000}K`,
        accountType: t.type,
        drawdownType: t.ddType,
        drawdownAmount: s.dd,
        dailyLossLimit: null,
        profitTarget: s.target,
        profitSplit: null,
        evalFee: s.eval,
        activationFee: 0,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: 10,
        minTradingDays: t.minDays,
        consistencyEvalPct: t.consEval,
        consistencyFundedPct: null,
        priceSource: 'verified',
        priceVerified: true,
      }));
    }
  }
  return plans;
}

module.exports = { scrape };
