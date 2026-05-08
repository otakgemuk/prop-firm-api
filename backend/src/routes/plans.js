// plans.js — GET /api/plans
//
// Returns plans joined with firm data and the computed "total_cost_to_funded"
// field. Supports query-string filters that map 1:1 to the sidebar controls
// on the frontend.

const { Router } = require("express");
const { db } = require("../utils/db");

const router = Router();

// ── Input validation helpers ───────────────────────────────
const MAX_SEARCH_LENGTH = 100;
const MAX_PARAM_LENGTH = 50;
const ALLOWED_DRAWDOWN_TYPES = new Set(["EOD", "trailing", "static", "intraday", "end_of_day", "eod"]);
const ALLOWED_SORT_ORDER = new Set(["asc", "desc"]);

function sanitizeString(val, maxLen = MAX_PARAM_LENGTH) {
  if (!val || typeof val !== "string") return null;
  return val.slice(0, maxLen).replace(/[^\w\s\-.,]/g, "");
}

function sanitizeInt(val) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? n : null;
}


const SORT_COLUMNS = {
  account_size:      "p.account_size",
  eval_fee:          "p.eval_fee",
  activation_fee:    "p.activation_fee",
  total_cost:        "total_cost_to_funded",
  profit_split:      "p.profit_split",
  drawdown_type:     "p.drawdown_type",
  trustpilot:        "f.trustpilot",
  firm_name:         "f.name",
};

router.get("/", (req, res, next) => {
  try {
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

    // ── Build WHERE clauses ────────────────────────────────
    // better-sqlite3: SQL uses $name, but the param object keys are WITHOUT $.
    const conditions = ["p.is_active = 1", "f.is_active = 1"];
    const params     = { limit: pageSize, offset };

    if (accountSize) {
      conditions.push("p.account_size = $accountSize");
      params.accountSize = parseInt(accountSize, 10);
    }

    if (accountSizeMin) {
      conditions.push("p.account_size >= $accountSizeMin");
      params.accountSizeMin = parseInt(accountSizeMin, 10);
    }
    if (accountSizeMax) {
      conditions.push("p.account_size <= $accountSizeMax");
      params.accountSizeMax = parseInt(accountSizeMax, 10);
    }

    if (drawdownType) {
      const types = drawdownType.split(",").map((t) => t.trim());
      const placeholders = types.map((_, i) => `$ddType${i}`);
      conditions.push(`p.drawdown_type IN (${placeholders.join(",")})`);
      types.forEach((t, i) => { params[`ddType${i}`] = t; });
    }

    if (platform) {
      conditions.push(`EXISTS (
        SELECT 1 FROM firm_platforms fp
        JOIN platforms pl ON pl.id = fp.platform_id
        WHERE fp.firm_id = f.id AND pl.name = $platform
      )`);
      params.platform = platform;
    }

    if (firm) {
      conditions.push("f.slug = $firm");
      params.firm = firm;
    }

    if (search) {
      const sanitizedSearch = sanitizeString(search, MAX_SEARCH_LENGTH);
      if (sanitizedSearch) {
        conditions.push("(f.name LIKE $search OR p.label LIKE $search)");
        params.search = `%${sanitizedSearch}%`;
      }
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sortCol = SORT_COLUMNS[sort] || SORT_COLUMNS.total_cost;
    const sortDir = order.toLowerCase() === "desc" ? "DESC" : "ASC";

    // ── Main query ─────────────────────────────────────────
    const sql = `
      WITH best_discount AS (
        SELECT dc.firm_id,
               MAX(dc.discount_pct) AS discount_pct
        FROM   discount_codes dc
        WHERE  dc.is_active = 1
          AND  (dc.valid_from  IS NULL OR dc.valid_from  <= datetime('now'))
          AND  (dc.valid_until IS NULL OR dc.valid_until >= datetime('now'))
        GROUP  BY dc.firm_id
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
        ROUND(
          p.eval_fee + p.activation_fee
          - (p.eval_fee * COALESCE(bd.discount_pct, 0) / 100.0), 2
        ) AS total_cost_to_funded,
        COALESCE(bd.discount_pct, 0) AS active_discount_pct
      FROM      plans p
      JOIN      firms f ON f.id = p.firm_id
      LEFT JOIN best_discount bd ON bd.firm_id = f.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $limit OFFSET $offset
    `;

    const rows = db.prepare(sql).all(params);

    // ── Total count for pagination ─────────────────────────
    const countSql = `
      SELECT COUNT(*) AS total
      FROM      plans p
      JOIN      firms f ON f.id = p.firm_id
      ${whereClause}
    `;
    const { total } = db.prepare(countSql).get(params);

    res.json({
      data: rows,
      pagination: {
        page:     pageNum,
        limit:    pageSize,
        total,
        pages:    Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
