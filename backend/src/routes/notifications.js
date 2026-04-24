/**
 * /api/notifications — User notification settings
 */

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware.js";
import { sendTestEmail } from "../notifier.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

const settingsSchema = z.object({
  email: z.boolean().optional(),
  daysBeforeDeadline: z.number().int().min(1).max(90).optional(),
});

/** GET /api/notifications/settings */
notificationsRouter.get("/settings", async (req, res) => {
  const settings = await prisma.notificationSetting.findUnique({
    where: { userId: req.user.id },
  });
  res.json({
    settings: settings ?? {
      email: true,
      daysBeforeDeadline: 14,
    },
  });
});

/** PUT /api/notifications/settings */
notificationsRouter.put("/settings", async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const settings = await prisma.notificationSetting.upsert({
    where: { userId: req.user.id },
    update: { ...parsed.data, updatedAt: new Date() },
    create: { userId: req.user.id, ...parsed.data },
  });
  res.json({ settings });
});

/** POST /api/notifications/test — sends a test email */
notificationsRouter.post("/test", async (req, res) => {
  try {
    const result = await sendTestEmail(req.user.email);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
