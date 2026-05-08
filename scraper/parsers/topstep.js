// Topstep parser
// Two account types: Standard (monthly + activation), No Activation (higher monthly)
const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f01",
  firmName: "Topstep",
  firmSlug: "topstep",
  websiteUrl: "https://www.topstep.com",
  trustpilot: 4.3,
};

const CONFIGS = [
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2000 },
  { size: 100000, label: "100K", target: 6000, maxLoss: 3000 },
  { size: 150000, label: "150K", target: 9000, maxLoss: 4500 },
];

// Known prices (verified May 2026)
const KNOWN_STANDARD      = { 50000: 49,  100000: 99,  150000: 149 };
const KNOWN_NO_ACTIVATION = { 50000: 95,  100000: 149, 150000: 229 };
const ACTIVATION_FEE = 149;

async function scrape() {
  try {
    const res = await fetch("https://help.topstep.com/en/articles/9208217-topstep-pricing", {
      headers: { "User-Agent": "PropFirmScraper/1.0 (+https://github.com/otakgemuk/prop-firm-api)" },
    });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const text = $.text();
      return parseFromText(text);
    }
  } catch (e) {
    console.warn(`[topstep] Help center fetch failed, falling back to homepage: ${e.message}`);
  }

  const html = await fetchRendered("https://www.topstep.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();
  return parseFromText(text);
}

function parseFromText(text) {
  const plans = [];

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 50;
  const consistencyFundedPct = extractConsistencyPercent(text, "fund") || 40;

  for (const cfg of CONFIGS) {
    const stdFee = KNOWN_STANDARD[cfg.size] || 0;
    if (stdFee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `topstep-std-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `Standard ${cfg.label}`,
        accountType: "Standard",
        drawdownType: "eod",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: null,
        profitTarget: cfg.target,
        profitSplit: null,
        evalFee: stdFee,
        activationFee: ACTIVATION_FEE,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: maxFunded || 1,
        minTradingDays: minDays || 10,
        consistencyEvalPct,
        consistencyFundedPct,
      }));
    }

    const noActFee = KNOWN_NO_ACTIVATION[cfg.size] || 0;
    if (noActFee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `topstep-na-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `No Activation ${cfg.label}`,
        accountType: "No Activation",
        drawdownType: "eod",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: null,
        profitTarget: cfg.target,
        profitSplit: null,
        evalFee: noActFee,
        activationFee: 0,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: maxFunded || 1,
        minTradingDays: minDays || 10,
        consistencyEvalPct,
        consistencyFundedPct,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
