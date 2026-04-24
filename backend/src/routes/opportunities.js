import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";

export const opportunitiesRouter = Router();

const listQuerySchema = z.object({
  kind: z.enum(["grant", "scholarship", "competition"]).optional(),
  q: z.string().max(200).optional(),
  country: z.string().max(200).optional(),
  field: z.string().max(200).optional(),
  type: z.string().max(200).optional(),
  degree: z.string().max(50).optional(),
  deadlineDays: z.coerce.number().int().positive().max(3650).optional(),
  sort: z.enum(["newest", "deadline", "amount"]).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

opportunitiesRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "invalid_query" });
  const q = parsed.data;

  const where = {};
  if (q.kind) where.kind = q.kind;
  if (q.country && q.country !== "all") where.country = q.country;
  if (q.field && q.field !== "all") where.field = q.field;
  if (q.type && q.type !== "all") where.type = q.type;
  if (q.degree && q.degree !== "all") where.degree = q.degree;
  if (q.deadlineDays) {
    const now = new Date();
    const end = new Date(now.getTime() + q.deadlineDays * 24 * 60 * 60 * 1000);
    where.deadline = { gte: now, lte: end };
  }
  if (q.q) {
    const term = q.q.trim();
    if (term) {
      where.OR = [
        { titleRu: { contains: term, mode: "insensitive" } },
        { titleKz: { contains: term, mode: "insensitive" } },
        { organization: { contains: term, mode: "insensitive" } },
        { field: { contains: term, mode: "insensitive" } },
        { type: { contains: term, mode: "insensitive" } },
      ];
    }
  }

  const page = q.page ?? 1;
  const limit = q.limit ?? 20;
  const skip = (page - 1) * limit;

  let orderBy = { createdAt: "desc" };
  if (q.sort === "deadline") orderBy = { deadline: "asc" };
  if (q.sort === "amount") orderBy = { amount: "desc" };
  if (q.sort === "newest") orderBy = { createdAt: "desc" };

  const [total, items] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  res.json({
    total,
    page,
    limit,
    items,
  });
});

opportunitiesRouter.get("/:id", async (req, res) => {
  const id = String(req.params.id || "");
  const item = await prisma.opportunity.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: "not_found" });
  res.json({ item });
});

