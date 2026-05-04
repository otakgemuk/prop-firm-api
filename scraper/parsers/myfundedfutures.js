// MyFundedFutures parser — Builder, Flex, Pro, Rapid types
const { buildPlan, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f03",
  firmName: "MyFundedFutures",
  firmSlug: "myfundedfutures",
  websiteUrl: "https://myfundedfutures.com",
  trustpilot: 4.4,
};

// Known prices (verified May 2026)
const KNOWN = [
  { size: 25000,  type: "Builder", eval: 75,  target: 1500, dd: 1000, freq: "biweekly" },
  { size: 25000,  type: "Flex",    eval: 84,  target: 1500, dd: 1000, freq: "weekly" },
  { size: 25000,  type: "Pro",     eval: 114, target: 1500, dd: 1000, freq: "biweekly" },
  { size: 25000,  type: "Rapid",   eval: 87,  target: 1500, dd: 1000, freq: "biweekly" },
  { size: 50000,  type: "Builder", eval: 75,  target: 3000, dd: 2000, freq: "biweekly" },
  { size: 50000,  type: "Flex",    eval: 127, target: 3000, dd: 2000, freq: "weekly" },
  { size: 50000,  type: "Pro",     eval: 114, target: 3000, dd: 2000, freq: "biweekly" },
  { size: 50000,  type: "Rapid",   eval: 126, target: 3000, dd: 2000, freq: "biweekly" },
  { size: 100000, type: "Builder", eval: 153, target: 6000, dd: 3000, freq: "biweekly" },
  { size: 100000, type: "Pro",     eval: 344, target: 6000, dd: 3000, freq: "biweekly" },
  { size: 100000, type: "Rapid",   eval: 267, target: 6000, dd: 3000, freq: "biweekly" },
  { size: 150000, type: "Builder", eval: 225, target: 9000, dd: 4500, freq: "biweekly" },
  { size: 150000, type: "Pro",     eval: 477, target: 9000, dd: 4500, freq: "biweekly" },
  { size: 150000, type: "Rapid",   eval: 347, target: 9000, dd: 4500, freq: "biweekly" },
];

async function scrape() {
  const res = await fetch("https://help.myfundedfutures.com/en/articles/11802636-traders-evaluation-simplified", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PropFirmScraper/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 50;

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `mffu-${cfg.type.toLowerCase()}-${cfg.size / 1000}k`,
    accountSize: cfg.size,
    planLabel: `${cfg.size / 1000}K ${cfg.type}`,
    accountType: cfg.type,
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: 0,
    profitTarget: cfg.target,
    profitSplit: 80,
    evalFee: cfg.eval,
    activationFee: 0,
    isOneTime: false,
    payoutFrequency: cfg.freq,
    maxFundedAccounts: maxFunded,
    minTradingDays: 2,
    consistencyEvalPct,
    consistencyFundedPct: null,
  }));
}

module.exports = { scrape };
