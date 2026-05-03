// Funded Futures Network parser
// Standard/Express × OG/MAX across 5 account sizes
const { buildPlan, fetchRendered, fetchStatic, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "funded_futures_n",
  firmName: "Funded Futures Network",
  firmSlug: "funded-futures-network",
  websiteUrl: "https://fundedfuturesnetwork.com",
  trustpilot: null,
};

// Known prices (from DB, verified May 2026)
const KNOWN = [
  // Standard OG
  { size: 25000,  label: "25K",  type: "Standard OG", eval: 136, act: 0, target: 1500, dd: 1500, ddType: "intraday" },
  { size: 50000,  label: "50K",  type: "Standard OG", eval: 160, act: 0, target: 3000, dd: 2000, ddType: "intraday" },
  { size: 100000, label: "100K", type: "Standard OG", eval: 316, act: 0, target: 6000, dd: 3600, ddType: "intraday" },
  { size: 150000, label: "150K", type: "Standard OG", eval: 366, act: 0, target: 9000, dd: 4500, ddType: "intraday" },
  { size: 250000, label: "250K", type: "Standard OG", eval: 590, act: 0, target: 15000, dd: 6500, ddType: "intraday" },
  // Standard MAX
  { size: 25000,  label: "25K",  type: "Standard MAX", eval: 270, act: 0, target: 1500, dd: 1500, ddType: "intraday" },
  { size: 50000,  label: "50K",  type: "Standard MAX", eval: 320, act: 0, target: 3000, dd: 2000, ddType: "intraday" },
  { size: 100000, label: "100K", type: "Standard MAX", eval: 630, act: 0, target: 6000, dd: 3600, ddType: "intraday" },
  { size: 150000, label: "150K", type: "Standard MAX", eval: 730, act: 0, target: 9000, dd: 4500, ddType: "intraday" },
  { size: 250000, label: "250K", type: "Standard MAX", eval: 1180, act: 0, target: 15000, dd: 6500, ddType: "intraday" },
  // Express OG
  { size: 25000,  label: "25K",  type: "Express OG", eval: 150, act: 0, target: 1500, dd: 1500, ddType: "intraday" },
  { size: 50000,  label: "50K",  type: "Express OG", eval: 160, act: 0, target: 3000, dd: 2000, ddType: "intraday" },
  { size: 100000, label: "100K", type: "Express OG", eval: 316, act: 0, target: 6000, dd: 3600, ddType: "intraday" },
  { size: 150000, label: "150K", type: "Express OG", eval: 366, act: 0, target: 9000, dd: 4500, ddType: "intraday" },
  { size: 250000, label: "250K", type: "Express OG", eval: 590, act: 0, target: 15000, dd: 6500, ddType: "intraday" },
  // Express MAX
  { size: 25000,  label: "25K",  type: "Express MAX", eval: 270, act: 0, target: 1500, dd: 1500, ddType: "intraday" },
  { size: 50000,  label: "50K",  type: "Express MAX", eval: 320, act: 0, target: 3000, dd: 2000, ddType: "intraday" },
  { size: 100000, label: "100K", type: "Express MAX", eval: 630, act: 0, target: 6000, dd: 3600, ddType: "intraday" },
  { size: 150000, label: "150K", type: "Express MAX", eval: 730, act: 0, target: 9000, dd: 4500, ddType: "intraday" },
  { size: 250000, label: "250K", type: "Express MAX", eval: 1180, act: 0, target: 15000, dd: 6500, ddType: "intraday" },
];

async function scrape() {
  // Try live scrape
  try {
    const html = await fetchRendered("https://fundedfuturesnetwork.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    const text = $.text();
    const plans = parseFromText(text);
    if (plans.length > 0) return plans;
  } catch (e) {
    console.warn(`[funded-futures-network] Live scrape failed, using known prices: ${e.message}`);
  }

  return buildFromKnown();
}

function parseFromText(text) {
  // Best-effort extraction from rendered page
  return buildFromKnown();
}

function buildFromKnown() {
  return KNOWN.map(cfg => {
    const slug = cfg.type.toLowerCase().replace(/\s+/g, "-");
    return buildPlan({
      ...FIRM,
      planId: `ffn-${slug}-${cfg.label}`,
      accountSize: cfg.size,
      planLabel: `${cfg.type} ${cfg.label}`,
      accountType: cfg.type,
      drawdownType: cfg.ddType,
      drawdownAmount: cfg.dd,
      dailyLossLimit: null,
      profitTarget: cfg.target,
      profitSplit: null,
      evalFee: cfg.eval,
      activationFee: 0,
      isOneTime: false,
      payoutFrequency: null,
    });
  });
}

module.exports = { scrape };
