// Bulenox parser
// Two account types per size:
//   - "No Scaling" (Opt 1): default, trailing drawdown
//   - "EOD" (Opt 2): end-of-day drawdown
const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f07", firmName: "Bulenox", firmSlug: "bulenox", websiteUrl: "https://bulenox.com", trustpilot: 4.0 };

const CONFIGS = [
  { size: 25000,  label: "25K",  target: 1500, maxLoss: 1250, dailyLoss: 500  },
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2500, dailyLoss: 1000 },
  { size: 100000, label: "100K", target: 6000, maxLoss: 3500, dailyLoss: 2000 },
  { size: 150000, label: "150K", target: 9000, maxLoss: 4500, dailyLoss: 3000 },
];

// Known prices (from website as of May 2026)
const KNOWN_NO_SCALING = { 25000: 145, 50000: 175, 100000: 215, 150000: 325 };
const KNOWN_EOD        = { 25000: 115, 50000: 155, 100000: 195, 150000: 295 };

async function scrape() {
  const html = await fetchRendered("https://bulenox.com", { waitFor: 5000 });
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
    // No Scaling (Opt 1) — trailing drawdown
    const noScalingFee = KNOWN_NO_SCALING[cfg.size] || 0;
    if (noScalingFee > 0) {
      plans.push(buildPlan({
        ...FIRM, planId: `bulenox-ns-${cfg.label}`, accountSize: cfg.size,
        planLabel: `${cfg.label}`,
        accountType: "No Scaling",
        drawdownType: "trailing", drawdownAmount: cfg.maxLoss, dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target, profitSplit: 80, evalFee: noScalingFee, isOneTime: false,
        payoutFrequency: "biweekly", maxFundedAccounts: maxFunded, minTradingDays: minDays,
        consistencyEvalPct, consistencyFundedPct,
      }));
    }

    // EOD (Opt 2) — end-of-day drawdown
    const eodFee = KNOWN_EOD[cfg.size] || 0;
    if (eodFee > 0) {
      plans.push(buildPlan({
        ...FIRM, planId: `bulenox-eod-${cfg.label}`, accountSize: cfg.size,
        planLabel: `${cfg.label} EOD`,
        accountType: "EOD",
        drawdownType: "EOD", drawdownAmount: cfg.maxLoss, dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target, profitSplit: 80, evalFee: eodFee, isOneTime: false,
        payoutFrequency: "biweekly", maxFundedAccounts: maxFunded, minTradingDays: minDays,
        consistencyEvalPct, consistencyFundedPct,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
