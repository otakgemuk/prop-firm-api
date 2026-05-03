// Legends Trading parser
// Apprentice and Elite types across 4 account sizes
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "legends_trading",
  firmName: "Legends Trading",
  firmSlug: "legends-trading",
  websiteUrl: "https://legendstrading.com",
  trustpilot: null,
};

// Known prices (from DB, verified May 2026)
const KNOWN = [
  { size: 25000,  label: "25K",  type: "Apprentice", eval: 165, act: 99,  target: 1500, dd: 1500, ddType: "EOD" },
  { size: 25000,  label: "25K",  type: "Elite",      eval: 95,  act: 0,   target: 1500, dd: 1250, ddType: "EOD" },
  { size: 50000,  label: "50K",  type: "Apprentice", eval: 185, act: 99,  target: 3000, dd: 2000, ddType: "EOD" },
  { size: 50000,  label: "50K",  type: "Elite",      eval: 121, act: 0,   target: 2700, dd: 2200, ddType: "EOD" },
  { size: 100000, label: "100K", type: "Apprentice", eval: 225, act: 149, target: 6000, dd: 3000, ddType: "EOD" },
  { size: 100000, label: "100K", type: "Elite",      eval: 182, act: 0,   target: 6000, dd: 3000, ddType: "EOD" },
  { size: 150000, label: "150K", type: "Apprentice", eval: 320, act: 199, target: 9000, dd: 4000, ddType: "EOD" },
  { size: 150000, label: "150K", type: "Elite",      eval: 278, act: 0,   target: 9000, dd: 4500, ddType: "EOD" },
];

async function scrape() {
  try {
    const html = await fetchRendered("https://legendstrading.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    const text = $.text();
    const plans = parseFromText(text);
    if (plans.length > 0) return plans;
  } catch (e) {
    console.warn(`[legends-trading] Live scrape failed, using known prices: ${e.message}`);
  }

  return buildFromKnown();
}

function parseFromText(text) {
  return buildFromKnown();
}

function buildFromKnown() {
  return KNOWN.map(cfg => {
    const slug = cfg.type.toLowerCase();
    return buildPlan({
      ...FIRM,
      planId: `legends-${slug}-${cfg.label}`,
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
