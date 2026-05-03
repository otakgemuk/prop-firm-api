// E8 Markets parser
// Signature Futures product line
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "e8_markets",
  firmName: "E8 Markets",
  firmSlug: "e8-markets",
  websiteUrl: "https://e8markets.com",
  trustpilot: null,
};

// Known prices (from DB, verified May 2026)
const KNOWN = [
  { size: 25000,  label: "25K",  eval: 110, act: 0, target: 1500, dd: 1000 },
  { size: 50000,  label: "50K",  eval: 150, act: 0, target: 3000, dd: 2000 },
  { size: 100000, label: "100K", eval: 260, act: 0, target: 6000, dd: 3000 },
  { size: 150000, label: "150K", eval: 390, act: 0, target: 9000, dd: 4500 },
];

async function scrape() {
  // Try live scrape (site is Cloudflare-protected, will likely need Playwright)
  try {
    const html = await fetchRendered("https://e8markets.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    const text = $.text();
    const plans = parseFromText(text);
    if (plans.length > 0) return plans;
  } catch (e) {
    console.warn(`[e8-markets] Live scrape failed, using known prices: ${e.message}`);
  }

  return buildFromKnown();
}

function parseFromText(text) {
  // E8 Markets site is Cloudflare-protected; extraction is best-effort
  const plans = [];
  for (const cfg of KNOWN) {
    const feeMatch = text.match(new RegExp(`\\$?(${cfg.eval})\\s*(?:\\/|per|mo)`, "i"));
    if (feeMatch) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `e8-sig-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `Signature Futures ${cfg.label}`,
        accountType: "Signature Futures",
        drawdownType: "EOD",
        drawdownAmount: cfg.dd,
        dailyLossLimit: null,
        profitTarget: cfg.target,
        profitSplit: null,
        evalFee: cfg.eval,
        activationFee: 0,
        isOneTime: false,
        payoutFrequency: null,
        maxFundedAccounts: 1,
        minTradingDays: 0,
      }));
    }
  }
  return plans;
}

function buildFromKnown() {
  return KNOWN.map(cfg => buildPlan({
    ...FIRM,
    planId: `e8-sig-${cfg.label}`,
    accountSize: cfg.size,
    planLabel: `Signature Futures ${cfg.label}`,
    accountType: "Signature Futures",
    drawdownType: "EOD",
    drawdownAmount: cfg.dd,
    dailyLossLimit: null,
    profitTarget: cfg.target,
    profitSplit: null,
    evalFee: cfg.eval,
    activationFee: 0,
    isOneTime: false,
    payoutFrequency: null,
    maxFundedAccounts: 1,
    minTradingDays: 0,
  }));
}

module.exports = { scrape };
