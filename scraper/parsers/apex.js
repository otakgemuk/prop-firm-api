// Apex Trader Funding parser
// Two account types: EOD and Intraday
const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f02",
  firmName: "Apex Trader Funding",
  firmSlug: "apex-trader-funding",
  websiteUrl: "https://apextraderfunding.com",
  trustpilot: 4.5,
};

// Known prices (verified May 2026)
const KNOWN_EOD = {
  25000:  { eval: 30,  act: 109 },
  50000:  { eval: 35,  act: 119 },
  100000: { eval: 60,  act: 139 },
  150000: { eval: 80,  act: 159 },
};

const KNOWN_INTRADAY = {
  25000:  { eval: 20,  act: 89 },
  50000:  { eval: 25,  act: 69 },
  100000: { eval: 40,  act: 119 },
  150000: { eval: 60,  act: 139 },
};

const SIZES = [25000, 50000, 100000, 150000];
const LABELS = { 25000: "25K", 50000: "50K", 100000: "100K", 150000: "150K" };
const TARGETS = { 25000: 1500, 50000: 3000, 100000: 6000, 150000: 9000 };
const DD_AMTS = { 25000: 1000, 50000: 2000, 100000: 3000, 150000: 4000 };

async function scrape() {
  let html;
  try {
    html = await fetchRendered("https://apextraderfunding.com", { waitFor: 5000 });
  } catch (e) {
    const res = await fetch("https://apextraderfunding.com", {
      headers: { "User-Agent": "PropFirmScraper/1.0 (+https://github.com/otakgemuk/prop-firm-api)" },
    });
    html = await res.text();
  }

  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : 20;
  const consistencyFundedPct = extractConsistencyPercent(text, "fund") || 50;

  const plans = [];

  for (const size of SIZES) {
    const label = LABELS[size];

    // EOD type
    const eod = KNOWN_EOD[size];
    if (eod) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `apex-eod-${label}`,
        accountSize: size,
        planLabel: `EOD ${label}`,
        accountType: "EOD",
        drawdownType: "eod",
        drawdownAmount: DD_AMTS[size],
        dailyLossLimit: null,
        profitTarget: TARGETS[size],
        profitSplit: null,
        evalFee: eod.eval,
        activationFee: eod.act,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: 20,
        minTradingDays: 1,
        consistencyEvalPct: null,
        consistencyFundedPct,
      }));
    }

    // Intraday type
    const intra = KNOWN_INTRADAY[size];
    if (intra) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `apex-intraday-${label}`,
        accountSize: size,
        planLabel: `Intraday ${label}`,
        accountType: "Intraday",
        drawdownType: "intraday",
        drawdownAmount: DD_AMTS[size],
        dailyLossLimit: null,
        profitTarget: TARGETS[size],
        profitSplit: null,
        evalFee: intra.eval,
        activationFee: intra.act,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: maxFunded,
        minTradingDays: 1,
        consistencyEvalPct: null,
        consistencyFundedPct,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
