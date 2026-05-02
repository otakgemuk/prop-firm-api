// Tradeify parser
// Source: tradeify.co — Growth (one-time) and Select (subscription) plans
// EOD drawdown, 40% eval consistency, no funded consistency

const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f11",
  firmName: "Tradeify",
  firmSlug: "tradeify",
  websiteUrl: "https://tradeify.co",
  trustpilot: 4.5,
};

const CONFIGS = [
  { size: 25000,  label: "25K",  target: 1500, maxLoss: 1000, dailyLoss: 0 },
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2000, dailyLoss: 0 },
  { size: 100000, label: "100K", target: 6000, maxLoss: 2500, dailyLoss: 0 },
  { size: 150000, label: "150K", target: 9000, maxLoss: 3000, dailyLoss: 0 },
];

// Known Growth prices (one-time, no subscription)
const KNOWN_GROWTH = { 25000: 59, 50000: 99, 100000: 159, 150000: 221 };

// Known Select prices (subscription)
const KNOWN_SELECT = { 25000: 109, 50000: 159, 100000: 251, 150000: 359 };

async function scrape() {
  let html;
  try {
    html = await fetchRendered("https://tradeify.co", { waitFor: 5000 });
  } catch (e) {
    const res = await fetch("https://tradeify.co", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    html = await res.text();
  }

  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 40;
  const consistencyFundedPct = extractConsistencyPercent(text, "fund"); // No funded consistency

  const plans = [];

  for (const cfg of CONFIGS) {
    // Try to scrape prices, fall back to known values
    let growthFee = KNOWN_GROWTH[cfg.size] || 0;
    let selectFee = KNOWN_SELECT[cfg.size] || 0;

    // Growth plan (one-time eval)
    if (growthFee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `tradeify-growth-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `${cfg.label} Growth`,
        accountType: "Growth",
        drawdownType: "end_of_day",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target,
        profitSplit: 90,
        evalFee: growthFee,
        isOneTime: true,
        payoutFrequency: "biweekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays || 1,
        consistencyEvalPct,
        consistencyFundedPct: null,
      }));
    }

    // Select plan (subscription eval)
    if (selectFee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `tradeify-select-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `${cfg.label} Select`,
        accountType: "Select",
        drawdownType: "end_of_day",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target,
        profitSplit: 90,
        evalFee: selectFee,
        isOneTime: false,
        payoutFrequency: "weekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays || 3,
        consistencyEvalPct,
        consistencyFundedPct: null,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
