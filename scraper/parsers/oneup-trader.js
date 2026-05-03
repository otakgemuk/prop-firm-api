// OneUp Trader parser
// Single "OneUp" account type, 1-Step evaluation
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "oneup_trader",
  firmName: "OneUp Trader",
  firmSlug: "oneup-trader",
  websiteUrl: "https://oneuptrader.com",
  trustpilot: null,
};

// Known prices (from DB, verified May 2026)
const KNOWN = [
  { size: 25000,  label: "25K",  eval: 65,  act: 65,  target: 1500,  dd: 1500, ddType: "trailing" },
  { size: 50000,  label: "50K",  eval: 75,  act: 75,  target: 3000,  dd: 2500, ddType: "trailing" },
  { size: 100000, label: "100K", eval: 150, act: 0,   target: 6000,  dd: 3500, ddType: "trailing" },
  { size: 150000, label: "150K", eval: 175, act: 0,   target: 9000,  dd: 5000, ddType: "trailing" },
  { size: 250000, label: "250K", eval: 325, act: 0,   target: 15000, dd: 5500, ddType: "trailing" },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://oneuptrader.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    const text = $.text();

    // Try to extract live prices
    const plans = [];
    for (const cfg of KNOWN) {
      const sizeLabel = `$${(cfg.size / 1000).toFixed(0)},000`;
      const pricePattern = new RegExp(`${sizeLabel}.*?\\$(\\d+)`, "is");
      const match = text.match(pricePattern);
      const evalFee = match ? parseInt(match[1], 10) : cfg.eval;

      plans.push(buildPlan({
        ...FIRM,
        planId: `oneup-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: cfg.label,
        accountType: "OneUp",
        drawdownType: cfg.ddType,
        drawdownAmount: cfg.dd,
        dailyLossLimit: null,
        profitTarget: cfg.target,
        profitSplit: 90,
        evalFee,
        activationFee: cfg.act,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: null,
        minTradingDays: 10,
      }));
    }
    return plans;
  } catch (e) {
    console.warn(`[oneup-trader] Live scrape failed, using known prices: ${e.message}`);
    return buildFromKnown();
  }
}

function buildFromKnown() {
  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `oneup-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: cfg.label,
    accountType: "OneUp",
    drawdownType: cfg.ddType,
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: 90,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: null,
    minTradingDays: 10,
  }));
}

module.exports = { scrape };
