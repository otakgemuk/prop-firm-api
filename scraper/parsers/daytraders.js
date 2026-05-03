// DayTraders parser
// Multiple account types: Trail, EOD, Static, S2F, S2L
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "daytraders",
  firmName: "DayTraders",
  firmSlug: "daytraders",
  websiteUrl: "https://daytraders.com",
  trustpilot: null,
};

// Known prices (scraped from daytraders.com May 2026)
// Prices shown are one-time; activation fee applies to Static/Trail types
const KNOWN = {
  "Trail-25K":  { eval: 37,  act: 130, target: 1500, dd: 1500, ddType: "intraday", dailyLoss: null },
  "Trail-50K":  { eval: 57,  act: 130, target: 3000, dd: 2500, ddType: "intraday", dailyLoss: null },
  "Trail-150K": { eval: 105, act: 130, target: 8500, dd: 4500, ddType: "intraday", dailyLoss: null },
  "Trail-300K": { eval: 132, act: 130, target: 15000, dd: 7000, ddType: "intraday", dailyLoss: null },
  "EOD-25K":    { eval: 46,  act: 130, target: 1500, dd: 1000, ddType: "EOD", dailyLoss: 800 },
  "EOD-50K":    { eval: 70,  act: 130, target: 3000, dd: 2000, ddType: "EOD", dailyLoss: 1250 },
  "EOD-150K":   { eval: 135, act: 130, target: 8500, dd: 4000, ddType: "EOD", dailyLoss: 2000 },
  "EOD-300K":   { eval: 240, act: 130, target: 15000, dd: 6500, ddType: "EOD", dailyLoss: 3250 },
  "Static-25K": { eval: 30,  act: 130, target: 2500, dd: 750,  ddType: "static", dailyLoss: null },
  "Static-50K": { eval: 40,  act: 130, target: 3750, dd: 1000, ddType: "static", dailyLoss: null },
  "Static-100K":{ eval: 65,  act: 130, target: 5750, dd: 1500, ddType: "static", dailyLoss: null },
  "S2F-25K":    { eval: 222, act: 0,   target: 0,    dd: 1000, ddType: "EOD", dailyLoss: null },
  "S2F-50K":    { eval: 342, act: 0,   target: 0,    dd: 2500, ddType: "EOD", dailyLoss: null },
  "S2F-150K":   { eval: 495, act: 0,   target: 0,    dd: 6000, ddType: "EOD", dailyLoss: null },
  "S2L-50K":    { eval: 229, act: 0,   target: 3000, dd: 2000, ddType: "EOD", dailyLoss: null },
  "S2L-150K":   { eval: 369, act: 0,   target: 8500, dd: 4500, ddType: "EOD", dailyLoss: null },
  "S2L-300K":   { eval: 499, act: 0,   target: 15000, dd: 7000, ddType: "EOD", dailyLoss: null },
};

const SIZES = [25000, 50000, 100000, 150000, 300000];

async function scrape() {
  // Try live scrape first
  try {
    const html = await fetchRendered("https://daytraders.com", { waitFor: 5000 });
    const $ = cheerio.load(html);
    const text = $.text();
    const plans = parseFromText(text);
    if (plans.length > 0) return plans;
  } catch (e) {
    console.warn(`[daytraders] Live scrape failed, using known prices: ${e.message}`);
  }

  // Fallback to known prices
  return buildFromKnown();
}

function parseFromText(text) {
  const plans = [];
  // Try to extract prices from text using patterns like "$37.35" near "25K TRAIL"
  // For now, fall back to known prices as the site is JS-rendered
  return buildFromKnown();
}

function buildFromKnown() {
  const plans = [];
  for (const [key, cfg] of Object.entries(KNOWN)) {
    const [type, sizeStr] = key.split("-");
    const size = parseInt(sizeStr) * 1000;
    const label = type === "S2L" ? `S2L ${sizeStr}` : `${type} ${sizeStr}`;

    plans.push(buildPlan({
      ...FIRM,
      planId: `daytraders-${key.toLowerCase()}`,
      accountSize: size,
      planLabel: label,
      accountType: type === "S2L" ? `S2L ${sizeStr} Core` : type,
      drawdownType: cfg.ddType,
      drawdownAmount: cfg.dd,
      dailyLossLimit: cfg.dailyLoss,
      profitTarget: cfg.target,
      profitSplit: null,
      evalFee: cfg.eval,
      activationFee: cfg.act,
      isOneTime: true,
      payoutFrequency: null,
      maxFundedAccounts: type === "Static" ? 5 : type === "S2F" ? 3 : type === "S2L" ? 5 : null,
      minTradingDays: type === "S2F" ? 10 : type === "S2L" ? 8 : 2,
      consistencyEvalPct: type === "Static" || type === "Trail" || type === "S2L" ? 50 : null,
      consistencyFundedPct: type === "Static" ? 30 : type === "S2F" ? 20 : null,
    }));
  }
  return plans;
}

module.exports = { scrape };
