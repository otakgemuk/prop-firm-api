// MyFundedFutures parser
// Source: help.myfundedfutures.com (structured help center pages)

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

  const plans = [];

  // Extract pricing table: "Account Size / Cost" section
  // Pattern: "$25,000 ... Flex - $84 ... Rapid - $87" etc.
  const priceBlock = text.match(/\$25,000[\s\S]*?\$150,000[\s\S]*?Rapid.*?\$347/i);

  // Known plan configs from the page
  const planConfigs = [
    { size: 25000, label: "25K", target: 1500, maxLoss: 1000, drawdown: "end_of_day", split: 80, freq: "biweekly" },
    { size: 50000, label: "50K", target: 3000, maxLoss: 2000, drawdown: "end_of_day", split: 80, freq: "biweekly" },
    { size: 100000, label: "100K", target: 6000, maxLoss: 3000, drawdown: "end_of_day", split: 80, freq: "biweekly" },
    { size: 150000, label: "150K", target: 9000, maxLoss: 4500, drawdown: "end_of_day", split: 80, freq: "biweekly" },
  ];

  // Try to extract prices from the page text
  // Look for patterns like "Flex - $84" or "Rapid - $87"
  const pricePatterns = [
    { size: 25000, patterns: [/Flex\s*[-–]\s*\$(\d+)/i, /Rapid\s*[-–]\s*\$(\d+)/i] },
    { size: 50000, patterns: [/Flex\s*[-–]\s*\$(\d+)/i, /Pro\s*[-–]\s*\$(\d+)/i, /Rapid\s*[-–]\s*\$(\d+)/i] },
    { size: 100000, patterns: [/Pro\s*[-–]\s*\$(\d+)/i, /Rapid\s*[-–]\s*\$(\d+)/i] },
    { size: 150000, patterns: [/Pro\s*[-–]\s*\$(\d+)/i, /Rapid\s*[-–]\s*\$(\d+)/i] },
  ];

  // Parse the pricing section more carefully
  // The page has: "$25,000 ... $50,000 ... $100,000 ... $150,000" with prices under each
  const pricingSection = text.substring(
    text.indexOf("Account Size / Cost"),
    text.indexOf("Evaluation Accounts")
  );

  // Extract all dollar amounts from the pricing section
  const prices = [];
  const priceRegex = /\$(\d[\d,]*)/g;
  let match;
  while ((match = priceRegex.exec(pricingSection)) !== null) {
    prices.push(parseMoney(match[1]));
  }

  // Map prices to plans (prices appear in order: 25K flex, 25K rapid, 50K flex, 50K pro, 50K rapid, ...)
  // This is fragile — may need adjustment when the page changes
  const rapidPrices = [];
  const proPrices = [];

  // Look for Rapid plan prices specifically
  const rapidMatch = pricingSection.match(/Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)/i);
  if (rapidMatch) {
    for (let i = 1; i <= 4; i++) rapidPrices.push(parseMoney(rapidMatch[i]));
  }

  // Look for Pro plan prices
  const proMatch = pricingSection.match(/Pro\s*[-–]\s*\$(\d+)[\s\S]*?Pro\s*[-–]\s*\$(\d+)[\s\S]*?Pro\s*[-–]\s*\$(\d+)/i);
  if (proMatch) {
    for (let i = 1; i <= 3; i++) proPrices.push(parseMoney(proMatch[i]));
  }

  // Build Rapid plans (available for all sizes)
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
      }));
    }
  }

  // Build Pro plans (100K and 150K)
  const proConfigs = planConfigs.slice(2); // 100K, 150K
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
      }));
    }
  }

  // If we couldn't parse prices, fall back to known values
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
      }));
    }
  }

  return plans;
}

module.exports = { scrape };
