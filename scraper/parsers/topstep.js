// Topstep parser
// Source: topstep.com (JS-rendered, uses Playwright)
//
// Topstep pricing (2026): monthly subscription model
// - Small Combine: $50K, $49/mo, $3K target, $2K max loss
// - Medium Combine: $100K, $99/mo, $6K target, $3K max loss
// - Large Combine: $150K, $149/mo, $9K target, $4.5K max loss
// Plus: Standard Path (lower monthly + $129 activation) vs No Activation Fee Path (higher monthly)

const { buildPlan, fetchRendered, parseMoney } = require("../utils");
const cheerio = require("cheerio");

const FIRM = {
  firmId: "f01",
  firmName: "Topstep",
  firmSlug: "topstep",
  websiteUrl: "https://www.topstep.com",
  trustpilot: 4.3,
};

async function scrape() {
  // Try the help center first (more structured)
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
    // Fall through to rendered page
  }

  // Fallback: render the main site
  const html = await fetchRendered("https://www.topstep.com", { waitFor: 5000 });
  const $ = cheerio.load(html);
  const text = $.text();
  return parseFromText(text);
}

function parseFromText(text) {
  const plans = [];

  // Look for pricing patterns: "$49", "$99", "$149" for monthly
  // And account sizes: $50,000, $100,000, $150,000
  const configs = [
    { size: 50000, label: "50K", target: 3000, maxLoss: 2000, drawdown: "end_of_day" },
    { size: 100000, label: "100K", target: 6000, maxLoss: 3000, drawdown: "end_of_day" },
    { size: 150000, label: "150K", target: 9000, maxLoss: 4500, drawdown: "end_of_day" },
  ];

  // Try to find monthly prices near account size mentions
  for (const cfg of configs) {
    const sizeStr = cfg.size.toLocaleString();
    const patterns = [
      new RegExp(`\\$${sizeStr}[\\s\\S]{0,200?\\$(\\d+)`, "i"),
      new RegExp(`${cfg.label}[\\s\\S]{0,200?\\$(\\d+)`, "i"),
    ];

    let fee = 0;
    for (const pat of patterns) {
      const m = text.match(pat);
      if (m) {
        fee = parseMoney(m[1]);
        if (fee > 0 && fee < 500) break; // reasonable monthly fee
        fee = 0;
      }
    }

    // Fallback to known prices
    if (!fee) {
      const known = { 50000: 49, 100000: 99, 150000: 149 };
      fee = known[cfg.size] || 0;
    }

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
        activationFee: 129, // Standard Path activation fee
        isOneTime: false,
        payoutFrequency: "biweekly",
      }));
    }
  }

  if (plans.length === 0) throw new Error("Could not extract any plans");
  return plans;
}

module.exports = { scrape };
