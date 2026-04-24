/**
 * /api/scraper — Admin endpoints for managing the scraper
 */

import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware.js";
import { runScraperNow, runNotifierNow } from "../cron.js";

export const scraperRouter = Router();

scraperRouter.use(requireAuth);
scraperRouter.use(requireRole("ADMIN"));

/** GET /api/scraper/logs — last 20 scraper runs */
scraperRouter.get("/logs", async (_req, res) => {
  const logs = await prisma.scraperLog.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });
  res.json({ logs });
});

/** POST /api/scraper/run — trigger scraper manually */
scraperRouter.post("/run", async (req, res) => {
  const source = req.body?.source ?? null;
  try {
    // Run in background, respond immediately
    res.json({ ok: true, message: "Scraper started in background" });
    const result = await runScraperNow(source);
    console.log("[scraper] finished:", result);
  } catch (err) {
    console.error("[scraper] error:", err.message);
  }
});

/** POST /api/scraper/notify — trigger notifier manually */
scraperRouter.post("/notify", async (_req, res) => {
  try {
    res.json({ ok: true, message: "Notifier started in background" });
    const result = await runNotifierNow();
    console.log("[notifier] finished:", result);
  } catch (err) {
    console.error("[notifier] error:", err.message);
  }
});

/** GET /api/scraper/stats — quick stats about scraped vs manual opportunities */
scraperRouter.get("/stats", async (_req, res) => {
  const [total, bySource, byKind] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.groupBy({ by: ["source"], _count: { id: true } }),
    prisma.opportunity.groupBy({ by: ["kind"], _count: { id: true } }),
  ]);

  res.json({
    total,
    bySource: bySource.map((r) => ({ source: r.source || "manual", count: r._count.id })),
    byKind: byKind.map((r) => ({ kind: r.kind, count: r._count.id })),
  });
});
