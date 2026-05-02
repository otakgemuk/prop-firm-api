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

  // Builder plans (all sizes)
  const builderMatch = pricingSection.match(/Builder\s*[-–]\s*\$(\d+)[\s\S]*?Builder\s*[-–]\s*\$(\d+)[\s\S]*?Builder\s*[-–]\s*\$(\d+)[\s\S]*?Builder\s*[-–]\s*\$(\d+)/i);
  const builderPrices = builderMatch ? [1,2,3,4].map(i => parseMoney(builderMatch[i])) : [];

  // Fallback known prices (from website as of May 2026)
  const knownFlex = { 25000: 84, 50000: 127 };
  const knownRapid = { 25000: 87, 50000: 126, 100000: 267, 150000: 347 };
  const knownBuilder = { 25000: 75, 50000: 75, 100000: 153, 150000: 225 };
  const knownPro = { 25000: 114, 50000: 114, 100000: 344, 150000: 477 };

  // Build plans for each type
  const TYPES = [
    { name: "Flex",    prices: flexPrices,    known: knownFlex,    sizes: [0, 1],        freq: "weekly" },
    { name: "Rapid",   prices: rapidPrices,   known: knownRapid,   sizes: [0,1,2,3],     freq: "biweekly" },
    { name: "Builder", prices: builderPrices, known: knownBuilder, sizes: [0,1,2,3],     freq: "biweekly" },
    { name: "Pro",     prices: proPrices,     known: knownPro,     sizes: [0,1,2,3],     freq: "biweekly" },
  ];

  for (const type of TYPES) {
    for (const idx of type.sizes) {
      const cfg = allConfigs[idx];
      if (!cfg) continue;
      const fee = type.prices[idx] || type.known[cfg.size] || 0;
      if (fee > 0) {
        plans.push(buildPlan({
          ...FIRM,
          planId: `mffu-${type.name.toLowerCase()}-${cfg.label}`,
          accountSize: cfg.size,
          planLabel: `${cfg.label} ${type.name}`,
          accountType: type.name,
          drawdownType: "end_of_day",
          drawdownAmount: cfg.maxLoss,
          dailyLossLimit: 0,
          profitTarget: cfg.target,
          profitSplit: cfg.split,
          evalFee: fee,
          isOneTime: false,
          payoutFrequency: type.freq,
          maxFundedAccounts: maxFunded,
          minTradingDays: minDays || 2,
          consistencyEvalPct,
          consistencyFundedPct,
        }));
      }
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
