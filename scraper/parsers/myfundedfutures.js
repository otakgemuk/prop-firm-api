// MyFundedFutures parser
const { buildPlan, parseMoney, extractConsistencyPercent } = require("../utils");
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

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval") || 50; // MFFU has 50% eval consistency
  const consistencyFundedPct = extractConsistencyPercent(text, "fund"); // No funded consistency

  const plans = [];

  // All plan configs (including 25K)
  const allConfigs = [
    { size: 25000,  label: "25K",  target: 1500, maxLoss: 1000, split: 80, freq: "biweekly" },
    { size: 50000,  label: "50K",  target: 3000, maxLoss: 2000, split: 80, freq: "biweekly" },
    { size: 100000, label: "100K", target: 6000, maxLoss: 3000, split: 80, freq: "biweekly" },
    { size: 150000, label: "150K", target: 9000, maxLoss: 4500, split: 80, freq: "biweekly" },
  ];

  // Try to parse prices from the help center page
  const pricingStart = text.indexOf("Account Size / Cost");
  const pricingEnd = text.indexOf("Evaluation Accounts");
  const pricingSection = (pricingStart !== -1 && pricingEnd !== -1 && pricingEnd > pricingStart)
    ? text.substring(pricingStart, pricingEnd)
    : text; // fall back to full text if section markers not found

  // Flex plans (25K and 50K only)
  const flexMatch = pricingSection.match(/Flex\s*[-–]\s*\$(\d+)[\s\S]*?Flex\s*[-–]\s*\$(\d+)/i);
  const flexPrices = flexMatch ? [parseMoney(flexMatch[1]), parseMoney(flexMatch[2])] : [];

  // Rapid plans (all sizes)
  const rapidMatch = pricingSection.match(/Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)[\s\S]*?Rapid\s*[-–]\s*\$(\d+)/i);
  const rapidPrices = rapidMatch ? [1,2,3,4].map(i => parseMoney(rapidMatch[i])) : [];

  // Pro plans (50K, 100K, 150K)
  const proMatch = pricingSection.match(/Pro\s*[-–]\s*\$(\d+)[\s\S]*?Pro\s*[-–]\s*\$(\d+)[\s\S]*?Pro\s*[-–]\s*\$(\d+)/i);
  const proPrices = proMatch ? [1,2,3].map(i => parseMoney(proMatch[i])) : [];

  // Fallback known prices (from help center as of March 2026)
  const knownFlex = { 25000: 84, 50000: 107 };
  const knownRapid = { 25000: 87, 50000: 157, 100000: 267, 150000: 347 };
  const knownPro = { 50000: 227, 100000: 344, 150000: 477 };

  // Build Flex plans (25K, 50K)
  const flexConfigs = allConfigs.slice(0, 2);
  for (let i = 0; i < flexConfigs.length; i++) {
    const cfg = flexConfigs[i];
    const fee = flexPrices[i] || knownFlex[cfg.size] || 0;
    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM, planId: `mffu-flex-${cfg.label}`, accountSize: cfg.size, planLabel: `${cfg.label} Flex`,
        drawdownType: "end_of_day", drawdownAmount: cfg.maxLoss, dailyLossLimit: 0,
        profitTarget: cfg.target, profitSplit: cfg.split, evalFee: fee, isOneTime: false,
        payoutFrequency: cfg.freq, maxFundedAccounts: maxFunded, minTradingDays: minDays || 2,
        consistencyEvalPct, consistencyFundedPct,
      }));
    }
  }

  // Build Rapid plans (all sizes)
  for (let i = 0; i < allConfigs.length; i++) {
    const cfg = allConfigs[i];
    const fee = rapidPrices[i] || knownRapid[cfg.size] || 0;
    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM, planId: `mffu-rapid-${cfg.label}`, accountSize: cfg.size, planLabel: `${cfg.label} Rapid`,
        drawdownType: "end_of_day", drawdownAmount: cfg.maxLoss, dailyLossLimit: 0,
        profitTarget: cfg.target, profitSplit: cfg.split, evalFee: fee, isOneTime: false,
        payoutFrequency: cfg.freq, maxFundedAccounts: maxFunded, minTradingDays: minDays || 2,
        consistencyEvalPct, consistencyFundedPct,
      }));
    }
  }

  // Build Pro plans (50K, 100K, 150K)
  const proConfigs = allConfigs.slice(1);
  for (let i = 0; i < proConfigs.length; i++) {
    const cfg = proConfigs[i];
    const fee = proPrices[i] || knownPro[cfg.size] || 0;
    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM, planId: `mffu-pro-${cfg.label}`, accountSize: cfg.size, planLabel: `${cfg.label} Pro`,
        drawdownType: "end_of_day", drawdownAmount: cfg.maxLoss, dailyLossLimit: 0,
        profitTarget: cfg.target, profitSplit: cfg.split, evalFee: fee, isOneTime: false,
        payoutFrequency: cfg.freq, maxFundedAccounts: maxFunded, minTradingDays: minDays || 2,
        consistencyEvalPct, consistencyFundedPct,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
