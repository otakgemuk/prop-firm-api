// server.js — Express entry point
//
// Environment variables (via .env or process.env):
//   DATABASE_URL   — PostgreSQL connection string
//   PORT           — HTTP port (default 3001)
//   CORS_ORIGIN    — allowed frontend origin (default "*")

require("dotenv").config();

const express = require("express");
const cors    = require("cors");

const plansRouter = require("./routes/plans");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

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
