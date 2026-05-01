// MyFundedFutures parser
const { buildPlan, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f03",
  firmName: "MyFundedFutures",
  firmSlug: "myfundedfutures",
  websiteUrl: "https://myfundedfutures.com",
  trustpilot: 4.4,
};

async function scrape() {
  const res = await fetch("https://help.myfundedfutures.com/en/articles/11802636-traders-evaluation-simplified", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PropFirmScraper/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const text = $.text();

  // Extract new fields
  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const hasConsistencyEval = /consistency\s*(?:rule|requirement|check)/i.test(text);
  const hasConsistencyFunded = /consistency\s*(?:rule|requirement|check).*fund/i.test(text);

  const plans = [];
  const planConfigs = [
    { size: 25000, label: "25K", target: 1500, maxLoss: 1000, drawdown: "end_of_day", split: 80, freq: "biweekly" },
    { size: 50000, label: "50K", target: 3000, maxLoss: 2000, drawdown: "end_of_day", split: 80, freq: "biweekly" },
    { size: 100000, label: "100K", target: 6000, maxLoss: 3000, drawdown: "end_of_day", split: 80, freq: "biweekly" },
    { size: 150000, label: "150K", target: 9000, maxLoss: 4500, drawdown: "end_of_day", split: 80, freq: "biweekly" },
  ];

  const pricingSection = text.substring(
    text.indexOf("Account Size / Cost"),
    text.indexOf("Evaluation Accounts")
  );

  const rapidMatch = pricingSection.match(/Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)/i);
  const rapidPrices = [];
  if (rapidMatch) {
    for (let i = 1; i <= 4; i++) rapidPrices.push(parseMoney(rapidMatch[i]));
  }

  const proMatch = pricingSection.match(/Pro\s*[-–]\s*\$(\d+)[\s\S]*?Pro\s*[-–]\s*\$(\d+)[\s\S]*?Pro\s*[-–]\s*\$(\d+)/i);
  const proPrices = [];
  if (proMatch) {
    for (let i = 1; i <= 3; i++) proPrices.push(parseMoney(proMatch[i]));
  }

  const prices = [];
  const priceRegex = /\$(\d[\d,]*)/g;
  let match;
  while ((match = priceRegex.exec(pricingSection)) !== null) {
    prices.push(parseMoney(match[1]));
  }

  // Rapid plans
  for (let i = 0; i < planConfigs.length; i++) {
    const cfg = planConfigs[i];
    const fee = rapidPrices[i] || prices[i * 2 + 1] || 0;
    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `mffu-rapid-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `${cfg.label} Rapid`,
        drawdownType: cfg.drawdown,
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: 0,
        profitTarget: cfg.target,
        profitSplit: cfg.split,
        evalFee: fee,
        isOneTime: false,
        payoutFrequency: cfg.freq,
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEval: hasConsistencyEval || null,
        consistencyFunded: hasConsistencyFunded || null,
      }));
    }
  }

  // Pro plans
  const proConfigs = planConfigs.slice(2);
  for (let i = 0; i < proConfigs.length; i++) {
    const cfg = proConfigs[i];
    const fee = proPrices[i] || 0;
    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `mffu-pro-${cfg.label}`,
        accountSize: cfg.size,
        planLabel: `${cfg.label} Pro`,
        drawdownType: cfg.drawdown,
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: 0,
        profitTarget: cfg.target,
        profitSplit: cfg.split,
        evalFee: fee,
        isOneTime: false,
        payoutFrequency: cfg.freq,
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEval: hasConsistencyEval || null,
        consistencyFunded: hasConsistencyFunded || null,
      }));
    }
  }

  // Fallback
  if (plans.length === 0) {
    console.warn("[myfundedfutures] Could not parse prices, using fallback data");
    const fallback = [
      { size: 25000, fee: 84, target: 1500, maxLoss: 1000 },
      { size: 50000, fee: 107, target: 3000, maxLoss: 2000 },
      { size: 100000, fee: 157, target: 6000, maxLoss: 3000 },
      { size: 150000, fee: 267, target: 9000, maxLoss: 4500 },
    ];
    for (const f of fallback) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `mffu-${(f.size / 1000).toFixed(0)}K`,
        accountSize: f.size,
        drawdownType: "end_of_day",
        drawdownAmount: f.maxLoss,
        dailyLossLimit: 0,
        profitTarget: f.target,
        profitSplit: 80,
        evalFee: f.fee,
        isOneTime: false,
        payoutFrequency: "biweekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEval: hasConsistencyEval || null,
        consistencyFunded: hasConsistencyFunded || null,
      }));
    }
  }

  return plans;
}

module.exports = { scrape };
