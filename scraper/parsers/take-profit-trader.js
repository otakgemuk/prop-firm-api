// Take Profit Trader parser
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f06", firmName: "Take Profit Trader", firmSlug: "take-profit-trader", websiteUrl: "https://takeprofittrader.com", trustpilot: 4.1 };

// Known RETAIL prices (verified May 2026)
// Standard (90/10 profit split) and Pro (80/20 profit split)
const KNOWN = [
  // Standard (90/10)
  { size: 25000,  label: "25K",  type: "Standard", eval: 150, act: 130, target: 1500, dd: 1500, profitSplit: 90 },
  { size: 50000,  label: "50K",  type: "Standard", eval: 250, act: 130, target: 3000, dd: 3000, profitSplit: 90 },
  { size: 75000,  label: "75K",  type: "Standard", eval: 350, act: 130, target: 4500, dd: 4500, profitSplit: 90 },
  { size: 100000, label: "100K", type: "Standard", eval: 450, act: 130, target: 6000, dd: 6000, profitSplit: 90 },
  { size: 150000, label: "150K", type: "Standard", eval: 360, act: 130, target: 9000, dd: 4500, profitSplit: 90 },
  // Pro (80/20)
  { size: 25000,  label: "25K",  type: "Pro",      eval: 250, act: 130, target: 1500, dd: 1500, profitSplit: 80 },
  { size: 50000,  label: "50K",  type: "Pro",      eval: 350, act: 130, target: 3000, dd: 3000, profitSplit: 80 },
];

async function scrape() {
  const html = await fetchRendered("https://takeprofittrader.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 5;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 50;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `tpt-${cfg.type.toLowerCase()}-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.label}`,
    accountType: cfg.type,
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: cfg.profitSplit,
    evalFee: cfg.eval,
    activationFee: cfg.act,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: maxFunded,
    minTradingDays: 5,
    consistencyEvalPct,
    consistencyFundedPct: null,
    priceSource: 'verified',
    priceVerified: true,
  }));
}

module.exports = { scrape };
