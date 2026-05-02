// Elite Trader Funding parser
// 6 plan types: 1-Step Monthly, Fast Track, Static, Direct to Funded, EOD Drawdown, Diamond Hands
const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f08",
  firmName: "Elite Trader Funding",
  firmSlug: "elite-trader-funding",
  websiteUrl: "https://elitetraderfunding.com",
  trustpilot: 4.3,
};

// 1-Step Monthly (Intraday Trailing)
const ONE_STEP = [
  { size: 50000,  label: "50K",  target: 3000,  maxLoss: 2000,  dailyLoss: 1000, fee: 165, contracts: "8 Minis" },
  { size: 100000, label: "100K", target: 6000,  maxLoss: 3000,  dailyLoss: 2000, fee: 205, contracts: "14 Minis" },
  { size: 150000, label: "150K", target: 9000,  maxLoss: 5000,  dailyLoss: 3000, fee: 295, contracts: "18 Minis" },
  { size: 250000, label: "250K", target: 15000, maxLoss: 5000,  dailyLoss: 4000, fee: 515, contracts: "25 Minis" },
  { size: 300000, label: "300K", target: 20000, maxLoss: 7500,  dailyLoss: 5000, fee: 655, contracts: "30 Minis" },
];

// Fast Track (Intraday Trailing, one-time)
const FAST_TRACK = [
  { size: 100000, label: "100K", target: 6000, maxLoss: 3000, dailyLoss: 2000, fee: 75, contracts: "14 Minis" },
];

// Static (Fixed drawdown, one-time)
const STATIC = [
  { size: 10000, label: "10K", target: 1000, maxLoss: 500, dailyLoss: 500, fee: 99, contracts: "2 Minis / 20 Micros" },
];

// Direct to Funded (Static, one-time)
const DTF = [
  { size: 25000, label: "25K", target: 0, maxLoss: 1500, dailyLoss: 1000, fee: 599, contracts: "4 Minis" },
];

// EOD Drawdown (End-of-Day, monthly)
const EOD = [
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2000, dailyLoss: 1000, fee: 155, contracts: "8 Minis" },
  { size: 100000, label: "100K", target: 6000, maxLoss: 3000, dailyLoss: 2000, fee: 190, contracts: "14 Minis" },
  { size: 150000, label: "150K", target: 9000, maxLoss: 5000, dailyLoss: 3000, fee: 280, contracts: "18 Minis" },
];

// Diamond Hands (EOD Trailing, monthly)
const DIAMOND = [
  { size: 50000, label: "50K", target: 3000, maxLoss: 2000, dailyLoss: 1000, fee: 180, contracts: "8 Minis" },
];

async function scrape() {
  const html = await fetchRendered("https://elitetraderfunding.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval");
  const consistencyFundedPct = extractConsistencyPercent(text, "fund");

  const plans = [];

  function addPlans(configs, accountType, drawdownType, isOneTime) {
    for (const cfg of configs) {
      if (cfg.fee > 0) {
        plans.push(buildPlan({
          ...FIRM,
          planId: `etf-${accountType.toLowerCase().replace(/\s+/g, "-")}-${cfg.label}`,
          accountSize: cfg.size,
          planLabel: `${cfg.label} ${accountType}`,
          accountType,
          drawdownType,
          drawdownAmount: cfg.maxLoss,
          dailyLossLimit: cfg.dailyLoss,
          profitTarget: cfg.target,
          profitSplit: 100,
          evalFee: cfg.fee,
          activationFee: 0,
          isOneTime,
          payoutFrequency: "biweekly",
          maxFundedAccounts: maxFunded,
          minTradingDays: minDays,
          consistencyEvalPct,
          consistencyFundedPct,
        }));
      }
    }
  }

  addPlans(ONE_STEP,   "1-Step Monthly",    "intraday",  false);
  addPlans(FAST_TRACK, "Fast Track",        "intraday",  true);
  addPlans(STATIC,     "Static",            "static",    true);
  addPlans(DTF,        "Direct to Funded",  "static",    true);
  addPlans(EOD,        "EOD Drawdown",      "end_of_day", false);
  addPlans(DIAMOND,    "Diamond Hands",     "end_of_day", false);

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
