// Topstep parser
// Two account types: Standard (monthly + activation), No Activation (higher monthly)
//
// Strategy: Fetch the pricing help article, then extract prices from page text.
// Falls back to KNOWN prices if live extraction fails.

const { buildPlan, fetchRendered, fetchStatic, parseMoney, extractConsistencyPercent } = require("../utils");
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

// Known prices (verified May 2026) — used as fallback
const KNOWN_STANDARD      = { 50000: 49,  100000: 99,  150000: 149 };
const KNOWN_NO_ACTIVATION = { 50000: 95,  100000: 149, 150000: 229 };
const ACTIVATION_FEE = 149;

async function scrape() {
  // Try help center first (static page, more reliable)
  let text = "";
  try {
    const html = await fetchStatic("https://help.topstep.com/en/articles/9208217-topstep-pricing");
    const $ = cheerio.load(html);
    text = $.text();
  } catch (e) {
    console.warn(`[topstep] Help center fetch failed: ${e.message}`);
  }

  // If help center didn't work, try homepage with JS rendering
  if (!text) {
    try {
      const html = await fetchRendered("https://www.topstep.com", { waitFor: 5000 });
      const $ = cheerio.load(html);
      text = $.text();
    } catch (e) {
      console.warn(`[topstep] Homepage fetch failed: ${e.message}`);
    }
  }

  // Try to extract live prices, fall back to known
  const livePrices = text ? extractPrices(text) : {};
  return buildPlans(livePrices);
}

// ── Extract prices from page text ──────────────────────────
function extractPrices(text) {
  const prices = { standard: {}, noActivation: {} };

  // Look for patterns like "$49/mo" or "$49/month" near "50K" or "Standard"
  // Topstep pricing page typically lists: Standard 50K $49/mo + $149 activation
  for (const cfg of CONFIGS) {
    const label = cfg.label;

    // Try to find price near account size label
    // Pattern: "50K ... $49" or "$49 ... 50K"
    const sizeStr = (cfg.size / 1000).toString();

    // Look for price patterns near the account size
    const patterns = [
      // "50K" followed by a price within 200 chars
      new RegExp(`${sizeStr}K[\\s\\S]{0,200}\\$(\\d+)`, "i"),
      // Price followed by "50K" within 200 chars
      new RegExp(`\\$(\\d+)[\\s\\S]{0,200}${sizeStr}K`, "i"),
      // "Standard 50K" → price
      new RegExp(`Standard\\s+${sizeStr}K[\\s\\S]{0,100}\\$(\\d+)`, "i"),
    ];

    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        const price = parseInt(m[1], 10);
        if (price > 0 && price < 1000) { // sanity check
          prices.standard[cfg.size] = price;
          break;
        }
      }
    }

    // Look for "No Activation" or "No Act" variant
    const noActPatterns = [
      new RegExp(`No\\s*(?:Act|Activation)[\\s\\S]{0,100}${sizeStr}K[\\s\\S]{0,100}\\$(\\d+)`, "i"),
      new RegExp(`${sizeStr}K[\\s\\S]{0,200}No\\s*(?:Act|Activation)[\\s\\S]{0,100}\\$(\\d+)`, "i"),
    ];

    for (const pat of noActPatterns) {
      const m = text.match(pat);
      if (m) {
        const price = parseInt(m[1], 10);
        if (price > 0 && price < 1000) {
          prices.noActivation[cfg.size] = price;
          break;
        }
      }
    }
  }

  return prices;
}

// ── Build plans from live or known prices ──────────────────
function buildPlans(livePrices) {
  const plans = [];

  // Determine prices: live → known fallback
  const stdPrices = { ...KNOWN_STANDARD, ...livePrices.standard };
  const naPrices = { ...KNOWN_NO_ACTIVATION, ...livePrices.noActivation };

  // Log which are live vs fallback
  for (const cfg of CONFIGS) {
    if (livePrices.standard?.[cfg.size]) {
      console.log(`  [topstep] ${cfg.label} Standard: $${livePrices.standard[cfg.size]} (live)`);
    }
    if (livePrices.noActivation?.[cfg.size]) {
      console.log(`  [topstep] ${cfg.label} No Activation: $${livePrices.noActivation[cfg.size]} (live)`);
    }
  }

  // Use page-level metadata if we got it
  const text = ""; // already parsed
  const consistencyEvalPct = 50;  // Topstep default
  const consistencyFundedPct = 40;
  const maxFunded = 1;
  const minDays = 10;

  for (const cfg of CONFIGS) {
    // Standard plan
    const stdFee = stdPrices[cfg.size] || 0;
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
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEvalPct,
        consistencyFundedPct,
      }));
    }

    // No Activation plan
    const noActFee = naPrices[cfg.size] || 0;
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
