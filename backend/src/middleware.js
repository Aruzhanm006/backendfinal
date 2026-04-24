import { getCookieName, verifyToken } from "./auth.js";
import { prisma } from "./db.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[getCookieName()];
    if (!token) return res.status(401).json({ error: "unauthorized" });
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) return res.status(401).json({ error: "unauthorized" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "unauthorized" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    if (req.user.role !== role) return res.status(403).json({ error: "forbidden" });
    next();
  };
}

