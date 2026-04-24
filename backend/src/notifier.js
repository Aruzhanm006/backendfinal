/**
 * Funding Aggregator — Email Notification Module
 *
 * Отправляет письма пользователям за N дней до дедлайна.
 * НЕ использует nodemailer — только встроенные модули Node.js.
 */

import { prisma } from "./db.js";
import { sendMail, getEtherealAccount } from "./mailer.js";

function log(...args) {
  console.log("[notifier]", new Date().toISOString(), ...args);
}

// ─── Email templates ──────────────────────────────────────────────────────────

function buildEmailHtml({ userName, opportunities, daysLeft }) {
  const plural = daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней";

  const itemsHtml = opportunities.map((o) => `
    <tr>
      <td style="padding:16px;border-bottom:1px solid #f0f4f8">
        <div style="margin-bottom:8px">
          <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
            background:${o.kind==="grant"?"#dbeafe":o.kind==="scholarship"?"#ede9fe":"#fef3c7"};
            color:${o.kind==="grant"?"#1d4ed8":o.kind==="scholarship"?"#7c3aed":"#b45309"}">
            ${o.kind==="grant"?"Грант":o.kind==="scholarship"?"Стипендия":"Конкурс"}
          </span>
        </div>
        <div style="font-size:15px;font-weight:700;color:#0b1220;margin-bottom:4px">${esc(o.titleRu)}</div>
        <div style="font-size:13px;color:#4a5568;margin-bottom:6px">${esc(o.organization)} · ${esc(o.country)}</div>
        <div style="font-size:13px;margin-bottom:12px">
          <strong style="color:#dc2626">Дедлайн: ${fmtDate(o.deadline)}</strong>
          ${o.amount > 0 ? ` &nbsp;·&nbsp; 💰 ${fmtMoney(o.amount)}` : ""}
        </div>
        <a href="${esc(o.url)}"
           style="display:inline-block;padding:8px 18px;background:#2563eb;color:white;
             border-radius:8px;text-decoration:none;font-size:13px;font-weight:700">
          Подать заявку →
        </a>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f9fc;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

    <!-- Header -->
    <tr><td style="background:#2563eb;padding:24px 32px;border-radius:16px 16px 0 0;text-align:center">
      <div style="color:white;font-size:20px;font-weight:900;margin-bottom:4px">FA Funding Aggregator</div>
      <div style="color:rgba(255,255,255,.85);font-size:14px">Напоминание о дедлайне</div>
    </td></tr>

    <!-- Body -->
    <tr><td style="background:white;padding:28px 32px">
      <h2 style="margin:0 0 8px;font-size:20px;color:#0b1220">Привет, ${esc(userName)}! 👋</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#4a5568;line-height:1.6">
        ${daysLeft === 1
          ? "⚠️ <strong>Завтра</strong> истекает срок подачи:"
          : `⏰ Осталось <strong>${daysLeft} ${plural}</strong> до дедлайна:`}
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px">
        ${itemsHtml}
      </table>
      <p style="margin:0 0 20px;font-size:13px;color:#4a5568;line-height:1.6">
        Вы получили это письмо, потому что сохранили эти возможности в избранное на
        <a href="http://localhost:3000" style="color:#2563eb">Funding Aggregator</a>.
      </p>
      <a href="http://localhost:3000/#/favorites"
         style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;
           border-radius:10px;text-decoration:none;font-size:14px;font-weight:700">
        Открыть избранное →
      </a>
    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#f1f5fb;padding:16px 32px;border-radius:0 0 16px 16px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">
        © ${new Date().getFullYear()} Funding Aggregator
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>`;
}

function buildEmailText({ userName, opportunities, daysLeft }) {
  const plural = daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней";
  const items = opportunities.map((o) =>
    `• ${o.titleRu}\n  ${o.organization} | ${o.country}\n  Дедлайн: ${fmtDate(o.deadline)}${o.amount > 0 ? ` | ${fmtMoney(o.amount)}` : ""}\n  ${o.url}`
  ).join("\n\n");

  return `Привет, ${userName}!

${daysLeft === 1 ? "Завтра" : `Через ${daysLeft} ${plural}`} истекает срок подачи:

${items}

Открыть избранное: http://localhost:3000/#/favorites

---
Funding Aggregator | © ${new Date().getFullYear()}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("ru-RU", { day:"numeric", month:"long", year:"numeric" });
}

function fmtMoney(n) {
  return n >= 1000 ? `$${(n/1000).toFixed(n%1000===0?0:1)}k` : `$${n}`;
}

// ─── Get SMTP config ──────────────────────────────────────────────────────────

async function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return {
      host,
      port: Number(process.env.SMTP_PORT || 587),
      user,
      pass,
      secure: Number(process.env.SMTP_PORT) === 465,
      from: process.env.SMTP_FROM || `"Funding Aggregator" <${user}>`,
    };
  }

  // Fallback: Ethereal test account
  const ethereal = await getEtherealAccount();
  if (ethereal) {
    return { ...ethereal, from: `"Funding Aggregator" <${ethereal.user}>` };
  }

  return null;
}

// ─── Send one email (with console fallback if no SMTP) ───────────────────────

async function deliver({ to, subject, text, html }) {
  const smtp = await getSmtpConfig();

  if (!smtp) {
    // No SMTP at all — just log to console (useful for development)
    log("━━━ EMAIL (console mock) ━━━");
    log(`To: ${to}`);
    log(`Subject: ${subject}`);
    log(text);
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return { ok: true, mock: true };
  }

  await sendMail({ ...smtp, to, subject, text, html });
  log(`sent to ${to}: "${subject}"`);
  return { ok: true };
}

// ─── Main: send deadline reminders ───────────────────────────────────────────

export async function sendDeadlineReminders() {
  log("starting deadline reminder run...");

  const now = new Date();
  let emailsSent = 0, errors = 0;

  const users = await prisma.user.findMany({
    include: {
      notifications: true,
      favorites: { include: { opportunity: true } },
    },
  });

  for (const user of users) {
    const settings   = user.notifications[0];
    const emailOn    = settings?.email !== false;
    const daysWindow = settings?.daysBeforeDeadline ?? 14;

    if (!emailOn || !user.favorites.length) continue;

    const upcoming = user.favorites.filter((fav) => {
      const opp = fav.opportunity;
      if (!opp?.isActive) return false;

      const daysLeft = (new Date(opp.deadline) - now) / 86400000;
      if (daysLeft < 0 || daysLeft > daysWindow) return false;

      // Don't re-notify within 3 days
      if (fav.notifiedAt) {
        const daysSince = (now - new Date(fav.notifiedAt)) / 86400000;
        if (daysSince < 3) return false;
      }
      return true;
    });

    if (!upcoming.length) continue;

    const daysLeft = Math.ceil(
      Math.min(...upcoming.map((f) => (new Date(f.opportunity.deadline) - now) / 86400000))
    );

    try {
      const plural = daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней";
      const opportunities = upcoming.map((f) => f.opportunity);

      await deliver({
        to: user.email,
        subject: `⏰ Дедлайн через ${daysLeft} ${plural} — Funding Aggregator`,
        text: buildEmailText({ userName: user.name, opportunities, daysLeft }),
        html: buildEmailHtml({ userName: user.name, opportunities, daysLeft }),
      });

      emailsSent++;

      // Mark as notified
      for (const fav of upcoming) {
        await prisma.favorite.update({
          where: { userId_opportunityId: { userId: user.id, opportunityId: fav.opportunityId } },
          data: { notifiedAt: now },
        });
      }
    } catch (err) {
      log(`error for ${user.email}: ${err.message}`);
      errors++;
    }
  }

  log(`done: ${emailsSent} sent, ${errors} errors`);
  return { emailsSent, errors };
}

// ─── Test email ───────────────────────────────────────────────────────────────

export async function sendTestEmail(toEmail) {
  const result = await deliver({
    to: toEmail,
    subject: "✅ Тест уведомлений — Funding Aggregator",
    text: "Уведомления работают! Вы будете получать письма за N дней до дедлайна.",
    html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:480px">
      <h2 style="color:#2563eb">✅ Уведомления работают!</h2>
      <p>SMTP настроен правильно. Вы будете получать напоминания до дедлайна.</p>
      <p style="color:#888;font-size:12px">— Funding Aggregator</p>
    </div>`,
  });
  return result;
}
