/**
 * Funding Aggregator — Cron Scheduler
 *
 * Расписание автозадач:
 *  - Парсер:       каждый день в 03:00 (когда сервер под меньшей нагрузкой)
 *  - Уведомления:  каждый день в 09:00
 *
 * Работает без внешних зависимостей через setInterval + Date.
 * Если нужен node-cron, логика легко переносится.
 */

import { runScraper } from "./scraper.js";
import { sendDeadlineReminders } from "./notifier.js";

function log(...args) {
  console.log("[cron]", new Date().toISOString(), ...args);
}

/**
 * Run a function at a specific hour (UTC) every day.
 * Checks every minute if it's time to run.
 */
function dailyAt(hourUTC, fn, name) {
  let lastRun = null;

  const check = async () => {
    const now = new Date();
    const day = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const hour = now.getUTCHours();

    if (hour === hourUTC && lastRun !== day) {
      lastRun = day;
      log(`running ${name}...`);
      try {
        const result = await fn();
        log(`${name} done:`, JSON.stringify(result));
      } catch (err) {
        log(`${name} error:`, err.message);
      }
    }
  };

  // Check immediately, then every 60 seconds
  check();
  const interval = setInterval(check, 60_000);
  log(`scheduled ${name} daily at ${hourUTC}:00 UTC`);
  return interval;
}

let scraperInterval = null;
let notifierInterval = null;
let _started = false;

export function startCron() {
  if (_started) return;
  _started = true;

  log("starting cron scheduler...");

  // Scraper: 03:00 UTC daily
  scraperInterval = dailyAt(3, () => runScraper(), "scraper");

  // Notifier: 09:00 UTC daily
  notifierInterval = dailyAt(9, () => sendDeadlineReminders(), "notifier");

  log("cron running. Scraper at 03:00 UTC, notifier at 09:00 UTC");
}

export function stopCron() {
  if (scraperInterval) clearInterval(scraperInterval);
  if (notifierInterval) clearInterval(notifierInterval);
  _started = false;
  log("cron stopped");
}

/**
 * Run scraper immediately (for testing / manual trigger)
 */
export async function runScraperNow(sourceName = null) {
  log("manual scraper run triggered");
  return runScraper({ sourceName });
}

/**
 * Run notifier immediately (for testing)
 */
export async function runNotifierNow() {
  log("manual notifier run triggered");
  return sendDeadlineReminders();
}
