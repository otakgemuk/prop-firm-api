// Topstep parser
const { buildPlan, fetchRendered, parseMoney, extractConsistencyPercent } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f01",
  firmName: "Topstep",
  firmSlug: "topstep",
  websiteUrl: "https://www.topstep.com",
  trustpilot: 4.3,
};

async function scrape() {
  try {
    const res = await fetch("https://help.topstep.com/en/articles/9208217-topstep-pricing", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PropFirmScraper/1.0)" },
    });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const text = $.text();
      return parseFromText(text);
    }
  } catch (e) {
    console.warn(`[topstep] Help center fetch failed, falling back to homepage: ${e.message}`);
  }

  const html = await fetchRendered("https://www.topstep.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();
  return parseFromText(text);
}

function parseFromText(text) {
  const plans = [];

  const maxFundedMatch = text.match(/(?:up to|max(?:imum)?)\s+(\d+)\s+funded\s+account/i);
  const maxFunded = maxFundedMatch ? parseInt(maxFundedMatch[1], 10) : null;
  const minDaysMatch = text.match(/(?:minimum|min)\s+(\d+)\s+(?:trading\s+)?days?/i);
  const minDays = minDaysMatch ? parseInt(minDaysMatch[1], 10) : null;
  const consistencyEvalPct = extractConsistencyPercent(text, "eval");
  const consistencyFundedPct = extractConsistencyPercent(text, "fund");

  const configs = [
    { size: 50000, label: "50K", target: 3000, maxLoss: 2000, drawdown: "end_of_day" },
    { size: 100000, label: "100K", target: 6000, maxLoss: 3000, drawdown: "end_of_day" },
    { size: 150000, label: "150K", target: 9000, maxLoss: 4500, drawdown: "end_of_day" },
  ];

  for (const cfg of configs) {
    const sizeStr = cfg.size.toLocaleString();
    const patterns = [
      new RegExp(`\\$${sizeStr}[\\s\\S]{0,200}?\\$(\\d+)`, "i"),
      new RegExp(`${cfg.label}[\\s\\S]{0,200}?\\$(\\d+)`, "i"),
    ];

    let fee = 0;
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) { fee = parseMoney(m[1]); if (fee > 0 && fee < 500) break; fee = 0; }
    }
    if (!fee) { const known = { 50000: 49, 100000: 99, 150000: 149 }; fee = known[cfg.size] || 0; }

    if (fee > 0) {
      plans.push(buildPlan({
        ...FIRM,
        planId: `topstep-${cfg.label}`,
        accountSize: cfg.size,
        drawdownType: cfg.drawdown,
        drawdownAmount: cfg.maxLoss,
        dailyLossLimit: Math.round(cfg.maxLoss / 2),
        profitTarget: cfg.target,
        profitSplit: 80,
        evalFee: fee,
        activationFee: 129,
        isOneTime: false,
        payoutFrequency: "biweekly",
        maxFundedAccounts: maxFunded,
        minTradingDays: minDays,
        consistencyEvalPct,
        consistencyFundedPct,
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
