// MyFundedFutures parser — Builder plans only (2 × 50K)
const { buildPlan, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f03",
  firmName: "MyFundedFutures",
  firmSlug: "myfundedfutures",
  websiteUrl: "https://myfundedfutures.com",
  trustpilot: 4.4,
};

// Known RETAIL prices (verified May 2026)
// Builder 50K has 2 variants (DD 2K and DD 1.5K). Other plans are standard.
const KNOWN = [
  { size: 25000,  type: "Flex",    eval: 84,  target: 1500, dd: 1000, freq: "weekly",  minDays: 2, consEval: 50 },
  { size: 25000,  type: "Pro",     eval: 114, target: 1500, dd: 1000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 25000,  type: "Rapid",   eval: 87,  target: 1500, dd: 1000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 50000,  type: "Builder", eval: 153, target: 3000, dd: 2000, discount: 10, discount: 10, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 50000,  type: "Builder", eval: 125, target: 3000, dd: 1500, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 50000,  type: "Flex",    eval: 127, target: 3000, dd: 2000, freq: "weekly",  minDays: 2, consEval: 50 },
  { size: 50000,  type: "Pro",     eval: 114, target: 3000, dd: 2000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 50000,  type: "Rapid",   eval: 126, target: 3000, dd: 2000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 100000, type: "Builder", eval: 153, target: 6000, dd: 3000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 100000, type: "Pro",     eval: 344, target: 6000, dd: 3000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 100000, type: "Rapid",   eval: 267, target: 6000, dd: 3000, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 150000, type: "Builder", eval: 225, target: 9000, dd: 4500, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 150000, type: "Pro",     eval: 477, target: 9000, dd: 4500, freq: "biweekly", minDays: 2, consEval: 50 },
  { size: 150000, type: "Rapid",   eval: 347, target: 9000, dd: 4500, freq: "biweekly", minDays: 2, consEval: 50 },
];

async function scrape() {
  try {
    const res = await fetch("https://help.myfundedfutures.com/en/articles/11802636-traders-evaluation-simplified", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PropFirmScraper/1.0)" },
    });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      // Future: extract live prices
    }
  } catch (e) {
    console.warn(`[myfundedfutures] Live scrape failed, using known prices: ${e.message}`);
  }

  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `mffu-builder-50k-dd${cfg.dd}`,
    accountSize: cfg.size,
    planLabel: `50K Builder (DD ${cfg.dd / 1000}K)`,
    accountType: "Builder",
    drawdownType: "eod",
    drawdownAmount: cfg.dd,
    dailyLossLimit: 0,
    profitTarget: cfg.target,
    profitSplit: 80,
    evalFee: cfg.eval,
    activationFee: 0,
    isOneTime: false,
    payoutFrequency: "biweekly",
    discountPct: cfg.discount || 0,
      maxFundedAccounts: null,
    minTradingDays: cfg.minDays,
    consistencyEvalPct: cfg.consEval,
    consistencyFundedPct: null,
    priceSource: 'verified',
    priceVerified: true,
  }));
}

module.exports = { scrape };
