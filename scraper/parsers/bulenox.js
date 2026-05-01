// Bulenox parser
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f07",
  firmName: "Bulenox",
  firmSlug: "bulenox",
  websiteUrl: "https://bulenox.com",
  trustpilot: 4.0,
};

const CONFIGS = [
  { size: 25000,  label: "25K",  target: 1500, maxLoss: 1250, dailyLoss: 500  },
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2500, dailyLoss: 1000 },
  { size: 100000, label: "100K", target: 6000, maxLoss: 3500, dailyLoss: 2000 },
];

async function scrape() {
  const html = await fetchRendered("https://bulenox.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const hasConsistencyEval = /consistency\s*(?:rule|requirement|check)/i.test(text);
  const hasConsistencyFunded = /consistency\s*(?:rule|requirement|check).*fund/i.test(text);

  const plans = [];

  for (const cfg of CONFIGS) {
    let fee = 0;
    const m = text.match(new RegExp(`${cfg.label}[\\s\\S]{0,300}?\\$(\\d+)`, "i"));
    if (m) { fee = parseMoney(m[1]); if (fee < 50 || fee > 2000) fee = 0; }
    if (!fee) { const known = { 25000: 100, 50000: 150, 100000: 200 }; fee = known[cfg.size]; }

    plans.push(buildPlan({
      ...FIRM,
      planId: `bulenox-${cfg.label}`,
      accountSize: cfg.size,
      drawdownType: "trailing",
      drawdownAmount: cfg.maxLoss,
      dailyLossLimit: cfg.dailyLoss,
      profitTarget: cfg.target,
      profitSplit: 80,
      evalFee: fee,
      isOneTime: true,
      payoutFrequency: "biweekly",
      maxFundedAccounts: maxFunded,
      minTradingDays: minDays,
      consistencyEval: hasConsistencyEval || null,
      consistencyFunded: hasConsistencyFunded || null,
    }));
  }
  return plans;
}

module.exports = { scrape };
