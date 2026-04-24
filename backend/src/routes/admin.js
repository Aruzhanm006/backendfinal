import { Router } from "express";
import { z } from "zod";

import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole("ADMIN"));

const opportunitySchema = z.object({
  kind: z.enum(["grant", "scholarship", "competition"]),
  titleRu: z.string().min(3).max(200),
  titleKz: z.string().min(3).max(200),
  organization: z.string().min(2).max(200),
  deadline: z.string().datetime(),
  amount: z.number().int().min(0).max(1_000_000_000),
  country: z.string().min(2).max(200),
  field: z.string().max(200).optional().nullable(),
  type: z.string().max(200).optional().nullable(),
  degree: z.string().max(50).optional().nullable(),
  organizer: z.string().max(200).optional().nullable(),
  prize: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  descRu: z.string().min(10).max(5000),
  descKz: z.string().min(10).max(5000),
  url: z.string().url().max(2000),
});

adminRouter.post("/opportunities", async (req, res) => {
  const parsed = opportunitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const data = parsed.data;
  const item = await prisma.opportunity.create({
    data: {
      ...data,
      deadline: new Date(data.deadline),
    },
  });
  res.json({ item });
});

adminRouter.patch("/opportunities/:id", async (req, res) => {
  const id = String(req.params.id || "");
  const parsed = opportunitySchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const data = parsed.data;
  const item = await prisma.opportunity.update({
    where: { id },
    data: {
      ...data,
      ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
    },
  });
  res.json({ item });
});

adminRouter.delete("/opportunities/:id", async (req, res) => {
  const id = String(req.params.id || "");
  await prisma.opportunity.delete({ where: { id } });
  res.json({ ok: true });
});

