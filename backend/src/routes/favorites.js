import { Router } from "express";

import { prisma } from "../db.js";
import { requireAuth } from "../middleware.js";

export const favoritesRouter = Router();

favoritesRouter.get("/", requireAuth, async (req, res) => {
  const rows = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    include: { opportunity: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    items: rows.map((r) => r.opportunity),
  });
});

favoritesRouter.post("/:opportunityId/toggle", requireAuth, async (req, res) => {
  const opportunityId = String(req.params.opportunityId || "");
  const exists = await prisma.favorite.findUnique({
    where: { userId_opportunityId: { userId: req.user.id, opportunityId } },
  });

  if (exists) {
    await prisma.favorite.delete({
      where: { userId_opportunityId: { userId: req.user.id, opportunityId } },
    });
    return res.json({ saved: false });
  }

  const op = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
  if (!op) return res.status(404).json({ error: "not_found" });

  await prisma.favorite.create({
    data: { userId: req.user.id, opportunityId },
  });
  res.json({ saved: true });
});

