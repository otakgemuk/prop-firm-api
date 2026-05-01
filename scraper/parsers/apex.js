// Apex Trader Funding parser
// Source: apextraderfunding.com

const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f02",
  firmName: "Apex Trader Funding",
  firmSlug: "apex-trader-funding",
  websiteUrl: "https://apextraderfunding.com",
  trustpilot: 4.5,
};

const CONFIGS = [
  { size: 25000,  label: "25K",  target: 1500,  maxLoss: 1250, dailyLoss: 625  },
  { size: 50000,  label: "50K",  target: 3000,  maxLoss: 2500, dailyLoss: 1250 },
  { size: 100000, label: "100K", target: 6000,  maxLoss: 3000, dailyLoss: 2000 },
  { size: 150000, label: "150K", target: 9000,  maxLoss: 5000, dailyLoss: 3000 },
  { size: 250000, label: "250K", target: 15000, maxLoss: 6500, dailyLoss: 4000 },
];

async function scrape() {
  let html;
  try {
    html = await fetchRendered("https://apextraderfunding.com", { waitFor: 5000 });
  } catch (e) {
    const res = await fetch("https://apextraderfunding.com", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    html = await res.text();
  }

  const $ = cheerio.load(html);
  const text = $.text();

  // Try to extract max funded accounts
  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;

  // Try to extract min trading days
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;

  // Check for consistency rules
  const hasConsistencyEval = /consistency\s*(?:rule|requirement|check)/i.test(text);
  const hasConsistencyFunded = /consistency\s*(?:rule|requirement|check).*fund/i.test(text);

  const plans = [];

  for (const cfg of CONFIGS) {
    const patterns = [
      new RegExp(`${cfg.label}[\\s\\S]{0,300}?\\$(\\d+)`, "i"),
      new RegExp(`\\$${cfg.size.toLocaleString()}[\\s\\S]{0,300}?\\$(\\d+)`, "i"),
    ];

    let fee = 0;
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        fee = parseMoney(m[1]);
        if (fee > 50 && fee < 2000) break;
        fee = 0;
      }
    }

    if (!fee) {
      const known = { 25000: 147, 50000: 167, 100000: 207, 150000: 297, 250000: 517 };
      fee = known[cfg.size] || 0;
    }

    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `apex-${cfg.label}`,
        accountSize: cfg.size,
        drawdownType: "end_of_day",
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: cfg.dailyLoss,
        profitTarget: cfg.target,
        profitSplit: 100,
        evalFee: fee,
        isOneTime: true,
        payoutFrequency: "biweekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEval: hasConsistencyEval || null,
        consistencyFunded: hasConsistencyFunded || null,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
