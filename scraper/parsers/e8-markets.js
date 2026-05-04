// E8 Markets parser — Signature Futures
const { buildPlan, fetchRendered } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "e8_markets",
  firmName: "E8 Markets",
  firmSlug: "e8-markets",
  websiteUrl: null,
  trustpilot: null,
};

const KNOWN = [
  { size: 25000,  label: "25K",  eval: 110, dd: 1000, target: 1500 },
  { size: 50000,  label: "50K",  eval: 150, dd: 2000, target: 3000 },
  { size: 100000, label: "100K", eval: 260, dd: 3000, target: 6000 },
  { size: 150000, label: "150K", eval: 390, dd: 4500, target: 9000 },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://e8markets.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    // Future: extract live prices from page
  } catch (e) {
    console.warn(`[e8-markets] Live scrape failed, using known prices: ${e.message}`);
  }

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `e8-sig-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: `Signature Futures ${cfg.label}`,
    accountType: "Signature Futures",
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: 0,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: 1,
    minTradingDays: 0,
    consistencyEvalPct: null,
    consistencyFundedPct: 35,
  }));
}

module.exports = { scrape };
