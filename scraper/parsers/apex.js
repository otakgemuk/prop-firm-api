// Apex Trader Funding parser
// Two account types:
//   - "Standard": monthly sub + free activation
//   - "No Activation": lower monthly + $140 activation fee
const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f02",
  firmName: "Apex Trader Funding",
  firmSlug: "apex-trader-funding",
  websiteUrl: "https://apextraderfunding.com",
  trustpilot: 4.5,
};

const CONFIGS = [
  { size: 25000,  label: "25K",  target: 1500,  maxLoss: 1250, dailyLoss: 625  },
  { size: 50000,  label: "50K",  target: 3000,  maxLoss: 2500, dailyLoss: 1250 },
  { size: 100000, label: "100K", target: 6000,  maxLoss: 3000, dailyLoss: 2000 },
  { size: 150000, label: "150K", target: 9000,  maxLoss: 5000, dailyLoss: 3000 },
  { size: 250000, label: "250K", target: 15000, maxLoss: 6500, dailyLoss: 4000 },
];

// Known prices (from website as of May 2026)
// Standard: free activation, higher monthly
const KNOWN_STANDARD = { 25000: 147, 50000: 167, 100000: 207, 150000: 297, 250000: 517 };
// No Activation: $140 activation, lower monthly
const KNOWN_NO_ACTIVATION = { 25000: 107, 50000: 127, 100000: 167, 150000: 257, 250000: 477 };
const ACTIVATION_FEE = 140;

async function scrape() {
  let html;
  try {
    html = await fetchRendered("https://apextraderfunding.com", { waitFor: 5000 });
  } catch (e) {
    const res = await fetch("https://apextraderfunding.com", {
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
  const consistencyEvalPct = extractConsistencyPercent(text, "eval");
  const consistencyFundedPct = extractConsistencyPercent(text, "fund");

  const plans = [];

  for (const cfg of CONFIGS) {
    // Standard type — free activation, higher monthly
    const stdFee = KNOWN_STANDARD[cfg.size] || 0;
    if (stdFee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `apex-std-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `${cfg.label}`,
        accountType: "Standard",
        drawdownType: "end_of_day",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target,
        profitSplit: 100,
        evalFee: stdFee,
        activationFee: 0,
        isOneTime: false,
        payoutFrequency: "biweekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEvalPct,
        consistencyFundedPct,
      }));
    }

    // No Activation type — $140 activation, lower monthly
    const noActFee = KNOWN_NO_ACTIVATION[cfg.size] || 0;
    if (noActFee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `apex-na-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `${cfg.label} No Act.`,
        accountType: "No Activation",
        drawdownType: "end_of_day",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target,
        profitSplit: 100,
        evalFee: noActFee,
        activationFee: ACTIVATION_FEE,
        isOneTime: false,
        payoutFrequency: "biweekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEvalPct,
        consistencyFundedPct,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
