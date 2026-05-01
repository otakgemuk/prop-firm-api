// plans.js — GET /api/plans
//
// Returns plans joined with firm data and the computed "total_cost_to_funded"
// field. Supports query-string filters that map 1:1 to the sidebar controls
// on the frontend.
//
// Query parameters (all optional):
//   accountSize   — exact int (50000, 100000 …)
//   accountSizeMin / accountSizeMax — range from slider
//   drawdownType  — comma-separated list: "trailing,static"
//   platform      — platform name (exact match)
//   firm          — firm slug
//   sort          — column to sort by (default: "total_cost")
//   order         — "asc" | "desc" (default: "asc")
//   search        — global text search across firm name + plan label
//   page          — 1-indexed page number (default: 1)
//   limit         — rows per page (default: 50, max: 200)

const { Router } = require("express");
const { query } = require("../utils/db");

const router = Router();

// Whitelisted sort columns — prevents SQL injection via ORDER BY
const SORT_COLUMNS = {
  account_size:      "p.account_size",
  eval_fee:          "p.eval_fee",
  activation_fee:    "p.activation_fee",
  total_cost:        "total_cost_to_funded",  // computed column alias
  profit_split:      "p.profit_split",
  drawdown_type:     "p.drawdown_type",
  trustpilot:        "f.trustpilot",
  firm_name:         "f.name",
};

router.get("/", async (req, res, next) => {
  try {
    // ── Parse & sanitise query params ──────────────────────────
    const {
      accountSize,
      accountSizeMin,
      accountSizeMax,
      drawdownType,
      platform,
      firm,
      sort = "total_cost",
      order = "asc",
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset   = (pageNum - 1) * pageSize;

    // ── Build WHERE clauses dynamically ────────────────────────
    const conditions = ["p.is_active = TRUE", "f.is_active = TRUE"];
    const params     = [];
    let   paramIdx   = 1;           // $1-based positional params

    // Exact account size
    if (accountSize) {
      conditions.push(`p.account_size = $${paramIdx}`);
      params.push(parseInt(accountSize, 10));
      paramIdx++;
    }

    // Account size range (slider)
    if (accountSizeMin) {
      conditions.push(`p.account_size >= $${paramIdx}`);
      params.push(parseInt(accountSizeMin, 10));
      paramIdx++;
    }
    if (accountSizeMax) {
      conditions.push(`p.account_size <= $${paramIdx}`);
      params.push(parseInt(accountSizeMax, 10));
      paramIdx++;
    }

    // Drawdown type — comma-separated → IN clause
    if (drawdownType) {
      const types = drawdownType.split(",").map((t) => t.trim());
      conditions.push(`p.drawdown_type = ANY($${paramIdx})`);
      params.push(types);
      paramIdx++;
    }

    // Platform filter — requires a JOIN through firm_platforms + platforms
    if (platform) {
      conditions.push(`EXISTS (
        SELECT 1 FROM firm_platforms fp
        JOIN platforms pl ON pl.id = fp.platform_id
        WHERE fp.firm_id = f.id AND pl.name = $${paramIdx}
      )`);
      params.push(platform);
      paramIdx++;
    }

    // Firm slug filter
    if (firm) {
      conditions.push(`f.slug = $${paramIdx}`);
      params.push(firm);
      paramIdx++;
    }

    // Global text search — trigram-free simple ILIKE across name + label
    if (search) {
      conditions.push(`(f.name ILIKE $${paramIdx} OR p.label ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    // ── Sort ───────────────────────────────────────────────────
    const sortCol   = SORT_COLUMNS[sort] || SORT_COLUMNS.total_cost;
    const sortDir   = order.toLowerCase() === "desc" ? "DESC" : "ASC";

    // ── Main query ─────────────────────────────────────────────
    //
    // "Total Cost to Funded" calculation:
    //   total = eval_fee + activation_fee - COALESCE(best active discount, 0)
    //
    // We pick the single best (highest %) active discount per firm.
    //
    const sql = `
      WITH best_discount AS (
        SELECT DISTINCT ON (dc.firm_id)
               dc.firm_id,
               dc.discount_pct
        FROM   discount_codes dc
        WHERE  dc.is_active = TRUE
          AND  (dc.valid_from   IS NULL OR dc.valid_from   <= NOW())
          AND  (dc.valid_until  IS NULL OR dc.valid_until  >= NOW())
        ORDER  BY dc.firm_id, dc.discount_pct DESC
      )
      SELECT
        f.id            AS firm_id,
        f.name          AS firm_name,
        f.slug          AS firm_slug,
        f.logo_url,
        f.website_url,
        f.trustpilot,
        p.id            AS plan_id,
        p.account_size,
        p.label         AS plan_label,
        p.drawdown_type,
        p.drawdown_amount,
        p.daily_loss_limit,
        p.profit_target,
        p.profit_split,
        p.eval_fee,
        p.activation_fee,
        p.monthly_fee,
        p.is_one_time,
        p.payout_frequency,
        p.first_payout_days,

        -- ▸ The key computed metric
        ROUND(
          p.eval_fee
          + p.activation_fee
          - (p.eval_fee * COALESCE(bd.discount_pct, 0) / 100.0),
          2
        ) AS total_cost_to_funded,

        COALESCE(bd.discount_pct, 0) AS active_discount_pct

      FROM      plans p
      JOIN      firms f ON f.id = p.firm_id
      LEFT JOIN best_discount bd ON bd.firm_id = f.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    params.push(pageSize, offset);

    const rows = await query(sql, params);

    // ── Total count for pagination ─────────────────────────────
    const countSql = `
      SELECT COUNT(*) AS total
      FROM      plans p
      JOIN      firms f ON f.id = p.firm_id
      ${whereClause}
    `;
    // Re-use the same WHERE params (exclude limit/offset)
    const countParams = params.slice(0, -2);
    const [{ total }] = await query(countSql, countParams);

    res.json({
      data: rows,
      pagination: {
        page:     pageNum,
        limit:    pageSize,
        total:    parseInt(total, 10),
        pages:    Math.ceil(parseInt(total, 10) / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
