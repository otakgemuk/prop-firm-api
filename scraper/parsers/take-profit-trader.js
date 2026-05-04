// Take Profit Trader parser
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f06", firmName: "Take Profit Trader", firmSlug: "take-profit-trader", websiteUrl: "https://takeprofittrader.com", trustpilot: 4.1 };

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  label: "25K",  eval: 150, act: 130, target: 1500, dd: 1500 },
  { size: 50000,  label: "50K",  eval: 170, act: 130, target: 3000, dd: 3000 },
  { size: 75000,  label: "75K",  eval: 250, act: 130, target: 4500, dd: 4500 },
  { size: 100000, label: "100K", eval: 330, act: 130, target: 6000, dd: 6000 },
  { size: 150000, label: "150K", eval: 360, act: 130, target: 9000, dd: 4500 },
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
    planId: `tpt-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: cfg.label,
    accountType: "TakeProfit",
    drawdownType: "eod",
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
