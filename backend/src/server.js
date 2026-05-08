// server.js — Express entry point
//
// Environment variables (via .env or process.env):
//   NODE_ENV       — 'production' or 'development' (production requires CORS_ORIGIN)
//   CORS_ORIGIN    — Allowed frontend origin (required in production; dev defaults to localhost)
//   PORT           — HTTP port (default 3001)
//   DB_PATH        — SQLite database file path (default ../data/propfirm.db)

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const rateLimit  = require("express-rate-limit");

const plansRouter = require("./routes/plans");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS validation ─────────────────────────────────────────
// Fail at startup if CORS_ORIGIN is unset in production.
// This prevents accidentally accepting all origins ("*") in prod.
const corsOrigin = process.env.CORS_ORIGIN;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !corsOrigin) {
  console.error(
    "[cors] FATAL: CORS_ORIGIN environment variable is required in production.\n" +
    "Set it to your frontend domain (e.g., https://example.com) and try again."
  );
  process.exit(1);
}

// Default to localhost in dev, never "*"
const allowedOrigin = corsOrigin || "http://localhost:5173";

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: allowedOrigin }));
console.log(`[cors] origin=${allowedOrigin} (production=${isProduction})`);

// Rate limiting — 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "100kb" }));

// ── Health check ───────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Routes ─────────────────────────────────────────────────
app.use("/api/plans", plansRouter);

// ── 404 catch-all ──────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "not found" }));

// ── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[express]", err);
  res.status(500).json({ error: "internal server error" });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
