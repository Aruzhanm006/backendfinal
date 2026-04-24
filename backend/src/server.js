import path from "node:path";
import { fileURLToPath } from "node:url";

import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import morgan from "morgan";

import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { favoritesRouter } from "./routes/favorites.js";
import { opportunitiesRouter } from "./routes/opportunities.js";
import { scraperRouter } from "./routes/scraper.js";
import { notificationsRouter } from "./routes/notifications.js";
import { startCron } from "./cron.js";
import { metricsMiddleware, metricsHandler } from "./metrics.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

const app = express();

app.disable("x-powered-by");
app.use(morgan("dev"));
app.use(metricsMiddleware);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ── API routes ────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get("/metrics", metricsHandler);

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/scraper", scraperRouter);
app.use("/api/notifications", notificationsRouter);

// ── Frontend (static) ─────────────────────────────────────────────────────────

// In container: FRONTEND_ROOT=/app/public  |  In dev: two levels up
const frontendRoot = process.env.FRONTEND_ROOT
  ? path.resolve(process.env.FRONTEND_ROOT)
  : path.resolve(__dirname, "..", "..");
const allowStatic = new Set(["/index.html", "/styles.css", "/app.js"]);

app.get(["/", "/index.html", "/styles.css", "/app.js"], (req, res) => {
  const urlPath = req.path === "/" ? "/index.html" : req.path;
  if (!allowStatic.has(urlPath)) return res.status(404).end();
  res.sendFile(path.join(frontendRoot, urlPath));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendRoot, "index.html"));
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  ✅  Server running on http://localhost:${PORT}`);
  console.log(`  📡  API: http://localhost:${PORT}/api/health\n`);

  // Start cron scheduler (scraper + notifier)
  startCron();
});
