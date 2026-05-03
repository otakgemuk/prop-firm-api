#!/usr/bin/env node
// scraper/index.js
//
// Prop Firm Data Scraper
// Fetches pricing data from each firm's website and upserts into SQLite.
// After all firms are scraped, export.js is called to regenerate plans.json.
//
// Usage:
//   node scraper/index.js                     # scrape all firms
//   node scraper/index.js --firm topstep      # scrape one firm
//   node scraper/index.js --diff              # show diff vs DB (no write)

const { upsertPlans, getExistingPlans, close } = require("./db");

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
  "tradeify":             require("./parsers/tradeify"),
  "daytraders":             require("./parsers/daytraders"),
  "e8-markets":            require("./parsers/e8-markets"),
  "funded-futures-network": require("./parsers/funded-futures-network"),
  "legends-trading":       require("./parsers/legends-trading"),
  "oneup-trader":          require("./parsers/oneup-trader"),
  "phoenix-trader-funding": require("./parsers/phoenix-trader-funding"),
};

// ── CLI args ───────────────────────────────────────────────
const args       = process.argv.slice(2);
const firmFilter = args.includes("--firm") ? args[args.indexOf("--firm") + 1] : null;
const showDiff   = args.includes("--diff");

// ── Main ───────────────────────────────────────────────────
async function main() {
  if (firmFilter && !parsers[firmFilter]) {
    console.error(`Unknown firm: ${firmFilter}`);
    console.error(`Available: ${Object.keys(parsers).join(", ")}`);
    process.exit(1);
  }

  const firmsToScrape = firmFilter
    ? { [firmFilter]: parsers[firmFilter] }
    : parsers;

  const errors  = [];
  let succeeded = 0;

  for (const [slug, parser] of Object.entries(firmsToScrape)) {
    console.log(`\n[${slug}] Scraping...`);

    let plans;
    try {
      plans = await withRetry(() => parser.scrape(), { slug, attempts: 3 });
    } catch (err) {
      console.error(`[${slug}] ✗ All attempts failed: ${err.message}`);
      errors.push({ slug, error: err.message });
      // Existing DB data for this firm is already intact — no action needed.
      const existing = getExistingPlans(slug);
      if (existing.length) {
        console.log(`[${slug}] ↩ Keeping ${existing.length} existing plans from DB`);
      }
      continue;
    }

    if (showDiff) {
      const existing = getExistingPlans(slug);
      printDiff(slug, existing, plans);
    } else {
      upsertPlans(slug, plans);
      console.log(`[${slug}] ✓ Upserted ${plans.length} plans`);
    }
    succeeded++;
  }

  // ── Summary ──────────────────────────────────────────────
  console.log(`\n─────────────────────────────────────`);
  console.log(`Scraped: ${succeeded}/${Object.keys(firmsToScrape).length} firms`);
  if (errors.length) {
    console.log(`⚠  ${errors.length} firm(s) had errors:`);
    errors.forEach(e => console.log(`   - ${e.slug}: ${e.error}`));
  }

  // Fail CI if too many scrapers errored — prevents stale data from
  // silently shipping without anyone noticing.
  const FAILURE_THRESHOLD = 3;
  if (!showDiff && errors.length >= FAILURE_THRESHOLD) {
    console.error(
      `\n✗ ${errors.length} scrapers failed (threshold: ${FAILURE_THRESHOLD}). ` +
      "Marking CI job as failed."
    );
    close();
    process.exit(1);
  }

  close();
}

// ── Retry helper ───────────────────────────────────────────
async function withRetry(fn, { slug, attempts = 3, delayMs = 2000 } = {}) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts) {
        console.warn(`[${slug}] attempt ${i} failed, retrying in ${delayMs * i}ms...`);
        await new Promise(r => setTimeout(r, delayMs * i));
      }
    }
  }
  throw lastErr;
}

// ── Diff printer (--diff mode) ─────────────────────────────
function printDiff(slug, existing, incoming) {
  const key    = p => `${p.account_size}:${p.account_type ?? "Standard"}`;
  const oldMap = new Map(existing.map(p => [key(p), p]));
  const newMap = new Map(incoming.map(p => [key(p), p]));

  let changes = 0;
  for (const [k, np] of newMap) {
    const op = oldMap.get(k);
    if (!op) {
      console.log(`  + NEW    [${slug}] ${np.plan_label ?? k} — $${np.eval_fee}`);
      changes++;
    } else if (op.eval_fee !== np.eval_fee || op.activation_fee !== np.activation_fee) {
      console.log(
        `  ~ CHANGE [${slug}] ${np.plan_label ?? k} — ` +
        `eval $${op.eval_fee}→$${np.eval_fee}, ` +
        `activation $${op.activation_fee}→$${np.activation_fee}`
      );
      changes++;
    }
  }
  for (const [k, op] of oldMap) {
    if (!newMap.has(k)) {
      console.log(`  - REMOVE [${slug}] ${op.label ?? k}`);
      changes++;
    }
  }
  if (changes === 0) console.log(`  [${slug}] No changes.`);
}

main().catch(err => {
  console.error("Fatal:", err);
  close();
  process.exit(1);
});
