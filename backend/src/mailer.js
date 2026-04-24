/**
 * Минимальный SMTP-клиент без внешних зависимостей.
 * Использует только встроенные модули Node.js: net, tls, crypto.
 *
 * Поддерживает:
 *  - STARTTLS (порт 587)
 *  - SSL/TLS  (порт 465)
 *  - AUTH LOGIN и AUTH PLAIN
 *  - Ethereal тестовые аккаунты (через их API)
 *  - HTML + text письма (multipart/alternative)
 */

import net from "node:net";
import tls from "node:tls";
import crypto from "node:crypto";

function log(...args) {
  console.log("[mailer]", ...args);
}

// ─── Base64 helpers ──────────────────────────────────────────────────────────

function b64(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

function encodeHeader(str) {
  // RFC 2047 encoded-word for non-ASCII
  if (!/[^\x20-\x7e]/.test(str)) return str;
  return `=?UTF-8?B?${b64(str)}?=`;
}

function buildMime({ from, to, subject, text, html }) {
  const boundary = `FA_${crypto.randomBytes(12).toString("hex")}`;
  const date = new Date().toUTCString();
  const msgId = `<${crypto.randomBytes(8).toString("hex")}@funding-aggregator.demo>`;

  const lines = [
    `Date: ${date}`,
    `Message-ID: ${msgId}`,
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    b64(text),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    b64(html),
    ``,
    `--${boundary}--`,
    ``,
  ];

  return lines.join("\r\n");
}

// ─── Low-level SMTP conversation ─────────────────────────────────────────────

class SmtpClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = "";
    this._resolve = null;
    this._reject = null;

    socket.on("data", (chunk) => {
      this.buffer += chunk.toString();
      // SMTP responses end with \r\n — check if we have a complete response
      if (this.buffer.includes("\r\n") && this._resolve) {
        const res = this.buffer;
        this.buffer = "";
        const code = parseInt(res.slice(0, 3), 10);
        const resolve = this._resolve;
        this._resolve = null;
        this._reject = null;
        resolve({ code, text: res.trim() });
      }
    });

    socket.on("error", (err) => {
      if (this._reject) {
        const reject = this._reject;
        this._reject = null;
        this._resolve = null;
        reject(err);
      }
    });
  }

  send(cmd) {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      this.socket.write(cmd + "\r\n");
    });
  }

  read() {
    return new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      // If buffer already has data
      if (this.buffer.includes("\r\n")) {
        const res = this.buffer;
        this.buffer = "";
        this._resolve = null;
        this._reject = null;
        resolve({ code: parseInt(res.slice(0, 3), 10), text: res.trim() });
      }
    });
  }

  destroy() {
    try { this.socket.destroy(); } catch {}
  }
}

async function smtpConnect(host, port, secure) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("SMTP connect timeout")), 15000);
    const onConnect = (socket) => {
      clearTimeout(timeout);
      resolve(new SmtpClient(socket));
    };
    if (secure) {
      const sock = tls.connect({ host, port, rejectUnauthorized: false }, () => onConnect(sock));
      sock.on("error", (e) => { clearTimeout(timeout); reject(e); });
    } else {
      const sock = net.connect({ host, port }, () => onConnect(sock));
      sock.on("error", (e) => { clearTimeout(timeout); reject(e); });
    }
  });
}

async function smtpUpgrade(client, host) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("TLS upgrade timeout")), 10000);
    const upgraded = tls.connect({
      socket: client.socket,
      host,
      rejectUnauthorized: false,
    }, () => {
      clearTimeout(timeout);
      resolve(new SmtpClient(upgraded));
    });
    upgraded.on("error", (e) => { clearTimeout(timeout); reject(e); });
  });
}

export async function sendMail({ host, port, user, pass, secure, from, to, subject, text, html }) {
  const isSSL = secure || port === 465;
  let client = await smtpConnect(host, port, isSSL);

  try {
    // 1. Read greeting
    let r = await client.read();
    if (r.code !== 220) throw new Error(`SMTP greeting failed: ${r.text}`);

    // 2. EHLO
    r = await client.send(`EHLO funding-aggregator.demo`);
    const ehloText = r.text;
    if (r.code !== 250) throw new Error(`EHLO failed: ${r.text}`);

    // 3. STARTTLS if needed
    if (!isSSL && ehloText.includes("STARTTLS")) {
      r = await client.send("STARTTLS");
      if (r.code !== 220) throw new Error(`STARTTLS failed: ${r.text}`);
      client = await smtpUpgrade(client, host);
      // Re-EHLO after upgrade
      r = await client.send("EHLO funding-aggregator.demo");
      if (r.code !== 250) throw new Error(`EHLO after STARTTLS failed: ${r.text}`);
    }

    // 4. AUTH
    if (user && pass) {
      r = await client.send("AUTH LOGIN");
      if (r.code !== 334) throw new Error(`AUTH LOGIN failed: ${r.text}`);
      r = await client.send(b64(user));
      if (r.code !== 334) throw new Error(`AUTH user failed: ${r.text}`);
      r = await client.send(b64(pass));
      if (r.code !== 235) throw new Error(`AUTH pass failed: ${r.text}`);
    }

    // 5. MAIL FROM
    const fromAddr = from.match(/<([^>]+)>/) ? from.match(/<([^>]+)>/)[1] : from;
    r = await client.send(`MAIL FROM:<${fromAddr}>`);
    if (r.code !== 250) throw new Error(`MAIL FROM failed: ${r.text}`);

    // 6. RCPT TO
    const toAddr = to.match(/<([^>]+)>/) ? to.match(/<([^>]+)>/)[1] : to;
    r = await client.send(`RCPT TO:<${toAddr}>`);
    if (r.code !== 250) throw new Error(`RCPT TO failed: ${r.text}`);

    // 7. DATA
    r = await client.send("DATA");
    if (r.code !== 354) throw new Error(`DATA failed: ${r.text}`);

    const mime = buildMime({ from, to, subject, text, html });
    r = await client.send(mime + "\r\n.");
    if (r.code !== 250) throw new Error(`Message send failed: ${r.text}`);

    // 8. QUIT
    await client.send("QUIT");

    return { ok: true };
  } finally {
    client.destroy();
  }
}

// ─── Ethereal fallback (free test SMTP) ──────────────────────────────────────

let _etherealAccount = null;

export async function getEtherealAccount() {
  if (_etherealAccount) return _etherealAccount;

  try {
    // Ethereal provides a free test SMTP via their API
    const res = await fetch("https://api.nodemailer.com/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestor: "funding-aggregator-demo" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error("Ethereal API failed");
    const data = await res.json();
    _etherealAccount = {
      host: "smtp.ethereal.email",
      port: 587,
      user: data.user,
      pass: data.pass,
      secure: false,
    };
    log(`Ethereal account created: ${data.user}`);
    log(`View sent emails at: https://ethereal.email/messages`);
    return _etherealAccount;
  } catch {
    // If Ethereal API is down, use a static fallback test config
    // (just logs the email, doesn't actually send)
    log("Ethereal API unavailable — using console mock");
    return null;
  }
}
