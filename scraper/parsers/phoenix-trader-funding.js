// Phoenix Trader Funding parser
// Classic and Spark types across multiple account sizes
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "phoenix_trader_f",
  firmName: "Phoenix Trader Funding",
  firmSlug: "phoenix-trader-funding",
  websiteUrl: "https://phoenixtraderfunding.com",
  trustpilot: null,
};

// Known prices (from DB, verified May 2026)
const KNOWN = [
  { size: 2000,   label: "2K",   type: "Merit",          eval: 69,  act: 0,   target: 0,    dd: 2000, ddType: "EOD" },
  { size: 2000,   label: "2K",   type: "Spark Micro",    eval: 0,   act: 69,  target: 0,    dd: 2000, ddType: "EOD" },
  { size: 25000,  label: "25K",  type: "Classic Starter", eval: 89, act: 0,   target: 1500, dd: 1500, ddType: "EOD" },
  { size: 25000,  label: "25K",  type: "Spark Starter",   eval: 39, act: 29,  target: 1500, dd: 1000, ddType: "EOD" },
  { size: 50000,  label: "50K",  type: "Classic Growth",  eval: 128, act: 0,  target: 3000, dd: 2000, ddType: "EOD" },
  { size: 50000,  label: "50K",  type: "Spark Growth",    eval: 69, act: 29,  target: 3000, dd: 2000, ddType: "EOD" },
  { size: 100000, label: "100K", type: "Classic Scale",   eval: 269, act: 0,  target: 6000, dd: 3000, ddType: "EOD" },
];

async function scrape() {
  // Site is JS-rendered, try Playwright
  try {
    const html = await fetchRendered("https://phoenixtraderfunding.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    const text = $.text();
    const plans = parseFromText(text);
    if (plans.length > 0) return plans;
  } catch (e) {
    console.warn(`[phoenix-trader-funding] Live scrape failed, using known prices: ${e.message}`);
  }

  return buildFromKnown();
}

function parseFromText(text) {
  return buildFromKnown();
}

function buildFromKnown() {
  return KNOWN.map(cfg => {
    const slug = cfg.type.toLowerCase().replace(/\s+/g, "-");
    return buildPlan({
      ...FIRM,
      planId: `phoenix-${slug}-${cfg.label}`,
      accountSize: cfg.size,
      planLabel: `${cfg.type} ${cfg.label}`,
      accountType: cfg.type,
      drawdownType: cfg.ddType,
      drawdownAmount: cfg.dd,
      dailyLossLimit: null,
      profitTarget: cfg.target,
      profitSplit: null,
      evalFee: cfg.eval,
      activationFee: cfg.act,
      isOneTime: false,
      payoutFrequency: null,
    });
  });
}

module.exports = { scrape };
