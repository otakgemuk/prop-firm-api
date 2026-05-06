// scraper/utils.js
//
// Shared utilities for all parsers.

const { chromium } = require("playwright");

// ── Shared browser instance (reused across parsers) ───────
let _browser = null;
let _browserLaunchPromise = null;

async function getBrowser() {
  if (_browser && _browser.isConnected()) return _browser;
  if (_browserLaunchPromise) return _browserLaunchPromise;

  _browserLaunchPromise = chromium.launch({ headless: true }).then(b => {
    _browser = b;
    _browserLaunchPromise = null;
    b.on('disconnected', () => { _browser = null; });
    return b;
  });
  return _browserLaunchPromise;
}

async function closeBrowser() {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}

// ── Fetch HTML with Playwright (handles JS-rendered sites) ─
async function fetchRendered(url, { waitFor = 3000, selector = null } = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (selector) {
      await page.waitForSelector(selector, { timeout: 10000 }).catch(() => {});
    } else {
      await page.waitForTimeout(waitFor);
    }
    return await page.content();
  } finally {
    await page.close();
  }
}

// ── Fetch plain HTML (for static sites / help centers) ─────
async function fetchStatic(url, { timeoutMs = 15000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Build a normalized plan object ─────────────────────────
function buildPlan({
  firmId,
  firmName,
  firmSlug,
  websiteUrl,
  trustpilot,
  planId,
  accountSize,
  planLabel,
  drawdownType,
  drawdownAmount,
  dailyLossLimit,
  profitTarget,
  profitSplit,
  evalFee,
  activationFee = 0,
  monthlyFee = 0,
  isOneTime = false,
  payoutFrequency = "biweekly",
  discountPct = 0,
  logoUrl = null,
  accountType = "Standard",
  // New fields
  maxFundedAccounts = null,
  minTradingDays = null,
  consistencyEvalPct = null,
  consistencyFundedPct = null,
}) {
  const discountedFee = Math.round(evalFee * (1 - discountPct / 100) * 100) / 100;
  const totalCost = Math.round((discountedFee + activationFee) * 100) / 100;
  const baseCost = Math.round((evalFee + activationFee) * 100) / 100;

  const plan = {
    firm_id: firmId,
    firm_name: firmName,
    firm_slug: firmSlug,
    logo_url: logoUrl,
    website_url: websiteUrl,
    trustpilot,
    plan_id: planId,
    account_size: accountSize,
    account_type: accountType,
    plan_label: planLabel || `${(accountSize / 1000).toFixed(0)}K`,
    drawdown_type: drawdownType,
    drawdown_amount: drawdownAmount,
    daily_loss_limit: dailyLossLimit,
    profit_target: profitTarget,
    profit_split: profitSplit,
    eval_fee: evalFee,
    activation_fee: activationFee,
    monthly_fee: monthlyFee,
    is_one_time: isOneTime ? 1 : 0,
    payout_frequency: payoutFrequency,
    total_cost_to_funded: totalCost,
    base_cost_to_funded: baseCost,
    active_discount_pct: discountPct,
  };

  // Only include new fields if provided (keeps existing data clean)
  if (maxFundedAccounts !== null) plan.max_funded_accounts = maxFundedAccounts;
  if (minTradingDays !== null) plan.min_trading_days = minTradingDays;
  if (consistencyEvalPct !== null) plan.consistency_eval = consistencyEvalPct;
  if (consistencyFundedPct !== null) plan.consistency_funded = consistencyFundedPct;

  return plan;
}

// ── Parse "$1,234" → 1234 ─────────────────────────────────
function parseMoney(str) {
  if (!str) return 0;
  // Remove currency symbols, commas, whitespace
  const cleaned = str.replace(/[$€£,\s]/g, "");
  // Handle ranges like "$50-$100" → take first value
  const parts = cleaned.split(/[-–—]/);
  const num = parseFloat(parts[0]);
  return isNaN(num) ? 0 : num;
}

// ── Parse "100%" → 100, "80/20" → 80 ─────────────────────
function parsePercent(str) {
  if (!str) return 0;
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ── Extract consistency percentage from page text ──────────
function extractConsistencyPercent(text, context = "") {
  const patterns = [
    new RegExp(`(\\d+)%\\s*consistency\\s*${context}`, "i"),
    new RegExp(`consistency\\s*${context}[^\\d]*(\\d+)%`, "i"),
    new RegExp(`consistency\\s*rule[^\\d]*(\\d+)%`, "i"),
    new RegExp(`(\\d+)%\\s*consistency\\s*rule`, "i"),
    new RegExp(`consistency\\s*[:=]\\s*(\\d+)%`, "i"),
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

module.exports = {
  fetchRendered, fetchStatic, buildPlan,
  parseMoney, parsePercent, extractConsistencyPercent,
  getBrowser, closeBrowser,
};
