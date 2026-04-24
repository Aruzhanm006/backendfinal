import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "../db.js";
import { getAuthCookieOptions, getCookieName, signToken } from "../auth.js";
import { requireAuth } from "../middleware.js";

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
});

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(200),
});

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "email_taken" });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash,
      role: "USER",
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(getCookieName(), token, getAuthCookieOptions());
  res.json({ user });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });

  const email = parsed.data.email.toLowerCase();
  const userRow = await prisma.user.findUnique({ where: { email } });
  if (!userRow) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await bcrypt.compare(parsed.data.password, userRow.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const user = {
    id: userRow.id,
    email: userRow.email,
    name: userRow.name,
    role: userRow.role,
    createdAt: userRow.createdAt,
  };

  const token = signToken({ sub: user.id, role: user.role });
  res.cookie(getCookieName(), token, getAuthCookieOptions());
  res.json({ user });
});

authRouter.post("/logout", async (_req, res) => {
  res.clearCookie(getCookieName(), { path: "/" });
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

