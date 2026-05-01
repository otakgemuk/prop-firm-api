#!/usr/bin/env node
// scraper/index.js
//
// Prop Firm Data Scraper
// Fetches pricing data from each firm's website and outputs normalized JSON.
//
// Usage:
//   node scraper/index.js                    # scrape all firms
//   node scraper/index.js --firm topstep      # scrape one firm
//   node scraper/index.js --diff              # show diff vs current data/plans.json
//   node scraper/index.js --apply             # scrape and overwrite data/plans.json

const fs = require("fs");
const path = require("path");

// ── Parser registry ────────────────────────────────────────
const parsers = {
  "topstep":              require("./parsers/topstep"),
  "apex-trader-funding":  require("./parsers/apex"),
  "myfundedfutures":      require("./parsers/myfundedfutures"),
  "tradeday":             require("./parsers/tradeday"),
  "lucid-trading":        require("./parsers/lucid-trading"),
  "take-profit-trader":   require("./parsers/take-profit-trader"),
  "bulenox":              require("./parsers/bulenox"),
  "elite-trader-funding": require("./parsers/elite-trader-funding"),
  "earn2trade":           require("./parsers/earn2trade"),
  "alpha-futures":        require("./parsers/alpha-futures"),
};

// ── CLI args ───────────────────────────────────────────────
const args = process.argv.slice(2);
const firmFilter = args.includes("--firm") ? args[args.indexOf("--firm") + 1] : null;
const showDiff = args.includes("--diff");
const applyChanges = args.includes("--apply");

// ── Main ───────────────────────────────────────────────────
async function main() {
  const DATA_PATH = path.join(__dirname, "../data/plans.json");
  const currentData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

  const firmsToScrape = firmFilter
    ? { [firmFilter]: parsers[firmFilter] }
    : parsers;

  if (firmFilter && !parsers[firmFilter]) {
    console.error(`Unknown firm: ${firmFilter}`);
    console.error(`Available: ${Object.keys(parsers).join(", ")}`);
    process.exit(1);
  }

  const results = [];
  const errors = [];

  for (const [slug, parser] of Object.entries(firmsToScrape)) {
    console.log(`\n[${slug}] Scraping...`);
    try {
      const plans = await parser.scrape();
      console.log(`[${slug}] ✓ Found ${plans.length} plans`);
      results.push(...plans);
    } catch (err) {
      console.error(`[${slug}] ✗ Error: ${err.message}`);
      errors.push({ slug, error: err.message });
      // Fall back to existing data for this firm
      const existing = currentData.filter((p) => p.firm_slug === slug);
      if (existing.length) {
        console.log(`[${slug}] ↩ Keeping ${existing.length} existing plans`);
        results.push(...existing);
      }
    }
  }

  // Sort by firm_name, then account_size
  results.sort((a, b) => {
    if (a.firm_name !== b.firm_name) return a.firm_name.localeCompare(b.firm_name);
    return a.account_size - b.account_size;
  });

  // ── Diff (match by firm_slug + account_size, not plan_id) ─
  if (showDiff) {
    console.log("\n═══ DIFF ═══");
    const key = (p) => `${p.firm_slug}:${p.account_size}`;
    const currentMap = new Map(currentData.map((p) => [key(p), p]));
    const newMap = new Map(results.map((p) => [key(p), p]));

    let changes = 0;
    for (const [k, newPlan] of newMap) {
      const old = currentMap.get(k);
      if (!old) {
        console.log(`  + NEW: ${newPlan.firm_name} ${newPlan.plan_label} — $${newPlan.eval_fee}`);
        changes++;
      } else if (old.eval_fee !== newPlan.eval_fee || old.total_cost_to_funded !== newPlan.total_cost_to_funded) {
        console.log(`  ~ CHANGED: ${newPlan.firm_name} ${newPlan.plan_label} — eval $${old.eval_fee}→$${newPlan.eval_fee}, total $${old.total_cost_to_funded}→$${newPlan.total_cost_to_funded}`);
        changes++;
      }
    }
    for (const [k, oldPlan] of currentMap) {
      if (!newMap.has(k)) {
        console.log(`  - REMOVED: ${oldPlan.firm_name} ${oldPlan.plan_label}`);
        changes++;
      }
    }
    if (changes === 0) console.log("  No changes detected.");
  }

  // ── Apply (preserve existing plan_ids where possible) ────
  if (applyChanges || (!showDiff && !firmFilter)) {
    // Merge: keep existing plan_id for matched plans
    const key = (p) => `${p.firm_slug}:${p.account_size}`;
    const oldIdMap = new Map(currentData.map((p) => [key(p), p.plan_id]));
    for (const plan of results) {
      const existingId = oldIdMap.get(key(plan));
      if (existingId) plan.plan_id = existingId;
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(results, null, 2) + "\n");
    console.log(`\n✓ Wrote ${results.length} plans to ${DATA_PATH}`);
  } else if (!showDiff) {
    // Default: print to stdout
    console.log(JSON.stringify(results, null, 2));
  }

  // ── Summary ──────────────────────────────────────────────
  if (errors.length) {
    console.log(`\n⚠ ${errors.length} firm(s) had errors:`);
    errors.forEach((e) => console.log(`  - ${e.slug}: ${e.error}`));
  }

  console.log(`\nTotal: ${results.length} plans across ${new Set(results.map(r => r.firm_id)).size} firms`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
