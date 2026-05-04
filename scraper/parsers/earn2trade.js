// Earn2Trade parser — TCP and Gauntlet plans
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f09", firmName: "Earn2Trade", firmSlug: "earn2trade", websiteUrl: "https://earn2trade.com", trustpilot: 4.2 };

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  label: "25K",  type: "TCP",      eval: 90,  act: 139, target: 1750, dd: 1500 },
  { size: 50000,  label: "50K",  type: "Gauntlet", eval: 150, act: 139, target: 3000, dd: 2000 },
  { size: 50000,  label: "50K",  type: "TCP",      eval: 150, act: 139, target: 3000, dd: 2000 },
  { size: 100000, label: "100K", type: "Gauntlet", eval: 245, act: 139, target: 6000, dd: 3500 },
  { size: 100000, label: "100K", type: "TCP",      eval: 270, act: 139, target: 6000, dd: 3000 },
  { size: 150000, label: "150K", type: "Gauntlet", eval: 315, act: 139, target: 9000, dd: 4500 },
  { size: 200000, label: "200K", type: "Gauntlet", eval: 400, act: 139, target: 12000, dd: 6000 },
];

async function scrape() {
  const html = await fetchRendered("https://earn2trade.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 1;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 30;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `e2t-${cfg.type.toLowerCase()}-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: `${cfg.type} ${cfg.label}`,
    accountType: cfg.type,
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
    minTradingDays: 10,
    consistencyEvalPct,
    consistencyFundedPct: null,
  }));
}

module.exports = { scrape };
