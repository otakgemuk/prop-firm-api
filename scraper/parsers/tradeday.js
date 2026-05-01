// TradeDay parser
// Source: tradeday.com (JS-rendered, uses Playwright)
// Static drawdown, weekly payouts, 90% split

const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f04",
  firmName: "TradeDay",
  firmSlug: "tradeday",
  websiteUrl: "https://tradeday.com",
  trustpilot: 4.6,
};

const CONFIGS = [
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2000, dailyLoss: 1000 },
  { size: 100000, label: "100K", target: 6000, maxLoss: 3000, dailyLoss: 2000 },
  { size: 150000, label: "150K", target: 9000, maxLoss: 4500, dailyLoss: 3000 },
];

async function scrape() {
  const html = await fetchRendered("https://tradeday.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();
  const plans = [];

  for (const cfg of CONFIGS) {
    let fee = 0;
    const m = text.match(new RegExp(`${cfg.label}[\\s\\S]{0,300?\\$(\\d+)`, "i"));
    if (m) {
      fee = parseMoney(m[1]);
      if (fee < 50 || fee > 2000) fee = 0;
    }
    if (!fee) {
      const known = { 50000: 150, 100000: 250, 150000: 350 };
      fee = known[cfg.size];
    }

    plans.push(buildPlan({
      ...FIRM,
      planId: `tradeday-${cfg.label}`,
      accountSize: cfg.size,
      drawdownType: "static",
      drawdownAmount: cfg.maxLoss,
      dailyLossLimit: cfg.dailyLoss,
      profitTarget: cfg.target,
      profitSplit: 90,
      evalFee: fee,
      isOneTime: false,
      payoutFrequency: "weekly",
    }));
  }

  return plans;
}

module.exports = { scrape };
