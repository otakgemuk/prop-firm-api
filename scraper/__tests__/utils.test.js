// __tests__/utils.test.js — Unit tests for scraper utility functions
//
// Run: node --test scraper/__tests__/utils.test.js

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildPlan, parseMoney, parsePercent, extractConsistencyPercent } = require("../utils");

// ── parseMoney ─────────────────────────────────────────────

describe("parseMoney", () => {
  it("parses dollar amounts with $ and commas", () => {
    assert.equal(parseMoney("$1,234"), 1234);
    assert.equal(parseMoney("$50"), 50);
    assert.equal(parseMoney("$1,234.56"), 1234.56);
  });

  it("parses plain numbers", () => {
    assert.equal(parseMoney("149"), 149);
    assert.equal(parseMoney("99.99"), 99.99);
  });

  it("returns 0 for empty/null input", () => {
    assert.equal(parseMoney(""), 0);
    assert.equal(parseMoney(null), 0);
    assert.equal(parseMoney(undefined), 0);
  });

  it("handles messy input", () => {
    assert.equal(parseMoney("USD 500"), 500);
    assert.equal(parseMoney("  $149  "), 149);
  });
});

// ── parsePercent ───────────────────────────────────────────

describe("parsePercent", () => {
  it("parses percentage strings", () => {
    assert.equal(parsePercent("80%"), 80);
    assert.equal(parsePercent("100%"), 100);
  });

  it("parses split format", () => {
    assert.equal(parsePercent("80/20"), 80);
  });

  it("returns 0 for empty input", () => {
    assert.equal(parsePercent(""), 0);
    assert.equal(parsePercent(null), 0);
  });
});

// ── extractConsistencyPercent ──────────────────────────────

describe("extractConsistencyPercent", () => {
  it("finds 'XX% consistency' pattern", () => {
    assert.equal(extractConsistencyPercent("You must follow the 40% consistency rule."), 40);
  });

  it("finds 'consistency rule: XX%' pattern", () => {
    assert.equal(extractConsistencyPercent("consistency rule: 30%"), 30);
  });

  it("returns null when no match", () => {
    assert.equal(extractConsistencyPercent("No consistency info here"), null);
  });

  it("handles context parameter", () => {
    const text = "50% consistency eval and 40% consistency funded";
    assert.equal(extractConsistencyPercent(text, "eval"), 50);
  });
});

// ── buildPlan ──────────────────────────────────────────────

describe("buildPlan", () => {
  const basePlan = {
    firmId: "f01",
    firmName: "TestFirm",
    firmSlug: "testfirm",
    websiteUrl: "https://testfirm.com",
    trustpilot: 4.5,
    planId: "p01",
    accountSize: 50000,
    planLabel: "50K",
    drawdownType: "EOD",
    drawdownAmount: 2000,
    dailyLossLimit: 1000,
    profitTarget: 3000,
    profitSplit: 80,
    evalFee: 100,
  };

  it("computes total_cost_to_funded correctly with no discount", () => {
    const plan = buildPlan(basePlan);
    assert.equal(plan.total_cost_to_funded, 100);
    assert.equal(plan.active_discount_pct, 0);
  });

  it("computes total_cost_to_funded correctly with discount", () => {
    const plan = buildPlan({ ...basePlan, discountPct: 20 });
    assert.equal(plan.total_cost_to_funded, 80);
    assert.equal(plan.active_discount_pct, 20);
  });

  it("includes activation fee in total cost", () => {
    const plan = buildPlan({ ...basePlan, activationFee: 50 });
    assert.equal(plan.total_cost_to_funded, 150);
  });

  it("applies discount only to eval fee, not activation", () => {
    const plan = buildPlan({ ...basePlan, evalFee: 200, activationFee: 50, discountPct: 50 });
    // 200 * 0.5 + 50 = 150
    assert.equal(plan.total_cost_to_funded, 150);
  });

  it("sets default fields correctly", () => {
    const plan = buildPlan(basePlan);
    assert.equal(plan.firm_id, "f01");
    assert.equal(plan.firm_slug, "testfirm");
    assert.equal(plan.payout_frequency, "biweekly");
    assert.equal(plan.is_one_time, 0);
    assert.equal(plan.monthly_fee, 0);
    assert.equal(plan.account_type, "Standard");
  });

  it("auto-generates plan label from account size if not provided", () => {
    const plan = buildPlan({ ...basePlan, planLabel: undefined });
    assert.equal(plan.plan_label, "50K");
  });

  it("includes optional new fields when provided", () => {
    const plan = buildPlan({
      ...basePlan,
      maxFundedAccounts: 3,
      minTradingDays: 5,
      consistencyEvalPct: 40,
      consistencyFundedPct: 30,
    });
    assert.equal(plan.max_funded_accounts, 3);
    assert.equal(plan.min_trading_days, 5);
    assert.equal(plan.consistency_eval, 40);
    assert.equal(plan.consistency_funded, 30);
  });

  it("sets price provenance fields", () => {
    const plan = buildPlan({ ...basePlan, retailEvalFee: 200, priceSource: "help_center", priceVerified: true });
    assert.equal(plan.retail_eval_fee, 200);
    assert.equal(plan.price_source, "help_center");
    assert.equal(plan.price_verified, 1);
  });
});
