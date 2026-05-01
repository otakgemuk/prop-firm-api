// db.js — PostgreSQL connection pool
// Uses pg.Pool for connection pooling. Config comes from DATABASE_URL env var.

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Pool sizing — tune per workload
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Log unexpected pool errors so they don't silently vanish
pool.on("error", (err) => {
  console.error("[pg pool] unexpected idle client error:", err);
});

/**
 * Convenience wrapper: runs a parameterised query and returns rows.
 * @param {string} text  — SQL with $1, $2, … placeholders
 * @param {any[]}  params
 * @returns {Promise<any[]>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 200) {
    console.warn(`[pg] slow query (${duration}ms):`, text.slice(0, 120));
  }
  return result.rows;
}

module.exports = { pool, query };
