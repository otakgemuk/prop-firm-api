// Bulenox parser
// Two account types: Option 1 (intraday) and Option 2 (EOD)
// Option 1 has a standing 89% discount, Option 2 has a standing 45% discount
const { buildPlan, fetchRendered, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = { firmId: "f07", firmName: "Bulenox", firmSlug: "bulenox", websiteUrl: "https://bulenox.com", trustpilot: 4.0 };

// Known sale prices (what users actually pay — post-discount)
const KNOWN_OPT1 = {
  25000:  { eval: 155, act: 143, dd: 1500 },
  50000:  { eval: 175, act: 148, dd: 2500 },
  100000: { eval: 215, act: 248, dd: 3000 },
  150000: { eval: 350, act: 498, dd: 4500 },
};

const KNOWN_OPT2 = {
  25000:  { eval: 175, act: 143, dd: 1500 },
  50000:  { eval: 195, act: 148, dd: 2500 },
  100000: { eval: 275, act: 248, dd: 3000 },
  150000: { eval: 400, act: 498, dd: 4500 },
};

const SIZES = [25000, 50000, 100000, 150000];
const LABELS = { 25000: "25K", 50000: "50K", 100000: "100K", 150000: "150K" };
const TARGETS = { 25000: 1500, 50000: 3000, 100000: 6000, 150000: 9000 };

function retailFromSale(salePrice, discountPct) {
  return Math.round(salePrice / (1 - discountPct / 100) * 100) / 100;
}

async function scrape() {
  let text = "";
  try {
    const html = await fetchRendered("https://bulenox.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    text = $.text();
  } catch (e) {
    console.warn(`[bulenox] Live scrape failed, using known prices: ${e.message}`);
  }

  const consistencyFundedPct = extractConsistencyPercent(text, "fund") || 40;
  const plans = [];

  for (const size of SIZES) {
    const label = LABELS[size];

    // Option 1 — intraday, standing 89% discount
    const opt1 = KNOWN_OPT1[size];
    if (opt1) {
      const retailEval = retailFromSale(opt1.eval, 89);
      plans.push(buildPlan({
        ...FIRM,
        planId: `bulenox-opt1-${label}`,
        accountSize: size,
        planLabel: `Option 1 ${label}`,
        accountType: "Option 1",
        drawdownType: "intraday",
        drawdownAmount: opt1.dd,
        dailyLossLimit: null,
        profitTarget: TARGETS[size],
        profitSplit: null,
        evalFee: retailEval,
        retailEvalFee: retailEval,
        activationFee: opt1.act,
        isOneTime: false,
        payoutFrequency: null,
        discountPct: 89,
        maxFundedAccounts: 1,
        minTradingDays: 1,
        consistencyEvalPct: null,
        consistencyFundedPct,
        priceSource: "manual",
        priceVerified: true,
      }));
    }

    // Option 2 — EOD, standing 45% discount
    const opt2 = KNOWN_OPT2[size];
    if (opt2) {
      const retailEval = retailFromSale(opt2.eval, 45);
      plans.push(buildPlan({
        ...FIRM,
        planId: `bulenox-opt2-${label}`,
        accountSize: size,
        planLabel: `Option 2 ${label}`,
        accountType: "Option 2",
        drawdownType: "eod",
        drawdownAmount: opt2.dd,
        dailyLossLimit: null,
        profitTarget: TARGETS[size],
        profitSplit: null,
        evalFee: retailEval,
        retailEvalFee: retailEval,
        activationFee: opt2.act,
        isOneTime: false,
        payoutFrequency: null,
        discountPct: 45,
        maxFundedAccounts: 1,
        minTradingDays: 1,
        consistencyEvalPct: null,
        consistencyFundedPct,
        priceSource: "manual",
        priceVerified: true,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
