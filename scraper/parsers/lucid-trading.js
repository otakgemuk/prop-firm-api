// Lucid Trading parser
const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f05",
  firmName: "Lucid Trading",
  firmSlug: "lucid-trading",
  websiteUrl: "https://lucidtrading.com",
  trustpilot: 4.2,
};

const CONFIGS = [
  { size: 50000,  label: "50K",  target: 3000, maxLoss: 2500, dailyLoss: 1250 },
  { size: 100000, label: "100K", target: 6000, maxLoss: 3500, dailyLoss: 2000 },
];

async function scrape() {
  const html = await fetchRendered("https://lucidtrading.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();
  const plans = [];

  for (const cfg of CONFIGS) {
    let fee = 0;
    const m = text.match(new RegExp(`${cfg.label}[\\s\\S]{0,300?\\$(\\d+)`, "i"));
    if (m) { fee = parseMoney(m[1]); if (fee < 50 || fee > 2000) fee = 0; }
    if (!fee) { const known = { 50000: 175, 100000: 275 }; fee = known[cfg.size]; }

    plans.push(buildPlan({
      ...FIRM,
      planId: `lucid-${cfg.label}`,
      accountSize: cfg.size,
      drawdownType: "trailing",
      drawdownAmount: cfg.maxLoss,
      dailyLossLimit: cfg.dailyLoss,
      profitTarget: cfg.target,
      profitSplit: 80,
      evalFee: fee,
      isOneTime: false,
      payoutFrequency: "weekly",
    }));
  }
  return plans;
}

module.exports = { scrape };
