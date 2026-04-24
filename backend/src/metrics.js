/**
 * Simple Prometheus-compatible metrics endpoint
 * GET /metrics — returns text/plain in Prometheus exposition format
 *
 * Метрикалар:
 *  - HTTP сұраулар саны (method, path, status)
 *  - Жауап уақыты (гистограмма)
 *  - Белсенді қолданушылар
 *  - Базадағы мүмкіндіктер саны
 *  - Парсер соңғы іске қосылу уақыты
 */

import { prisma } from './db.js';

// ── In-memory counters ────────────────────────────────────────────────────────

const startTime = Date.now();

const counters = {
  http_requests_total: {},   // { 'GET /api/opportunities 200': N }
  http_errors_total: 0,
};

const histogramBuckets = [10, 25, 50, 100, 200, 500, 1000, 2500, 5000];
const latencyHist = {};     // { bucket: count }
let latencySum = 0;
let latencyCount = 0;

histogramBuckets.forEach(b => { latencyHist[b] = 0; });

// ── Middleware — track every request ─────────────────────────────────────────

export function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const key = `${req.method} ${req.route?.path || req.path} ${res.statusCode}`;

    // Count requests
    counters.http_requests_total[key] = (counters.http_requests_total[key] || 0) + 1;
    if (res.statusCode >= 500) counters.http_errors_total++;

    // Latency histogram
    latencySum += ms;
    latencyCount++;
    for (const b of histogramBuckets) {
      if (ms <= b) latencyHist[b]++;
    }
  });

  next();
}

// ── Format Prometheus text ────────────────────────────────────────────────────

function prom(name, help, type, lines) {
  return `# HELP ${name} ${help}\n# TYPE ${name} ${type}\n${lines.join('\n')}\n`;
}

// ── Metrics handler ───────────────────────────────────────────────────────────

export async function metricsHandler(_req, res) {
  const output = [];

  // 1. Uptime
  const uptimeSeconds = (Date.now() - startTime) / 1000;
  output.push(prom('process_uptime_seconds', 'Server uptime in seconds', 'gauge',
    [`process_uptime_seconds ${uptimeSeconds.toFixed(1)}`]
  ));

  // 2. HTTP requests
  const reqLines = Object.entries(counters.http_requests_total).map(([label, count]) => {
    const parts = label.split(' ');
    const method = parts[0];
    const path = parts.slice(1, -1).join(' ');
    const status = parts[parts.length - 1];
    return `http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`;
  });
  if (reqLines.length) {
    output.push(prom('http_requests_total', 'Total HTTP requests', 'counter', reqLines));
  }

  // 3. HTTP errors
  output.push(prom('http_errors_total', 'Total HTTP 5xx errors', 'counter',
    [`http_errors_total ${counters.http_errors_total}`]
  ));

  // 4. Latency histogram
  const histLines = histogramBuckets.map(b =>
    `http_request_duration_ms_bucket{le="${b}"} ${latencyHist[b]}`
  );
  histLines.push(`http_request_duration_ms_bucket{le="+Inf"} ${latencyCount}`);
  histLines.push(`http_request_duration_ms_sum ${latencySum}`);
  histLines.push(`http_request_duration_ms_count ${latencyCount}`);
  output.push(prom('http_request_duration_ms', 'HTTP request duration in milliseconds', 'histogram', histLines));

  // 5. Database metrics (async)
  try {
    const [oppCount, userCount, favCount] = await Promise.all([
      prisma.opportunity.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.favorite.count(),
    ]);
    output.push(prom('db_opportunities_total', 'Total active opportunities in database', 'gauge',
      [`db_opportunities_total ${oppCount}`]
    ));
    output.push(prom('db_users_total', 'Total registered users', 'gauge',
      [`db_users_total ${userCount}`]
    ));
    output.push(prom('db_favorites_total', 'Total saved favorites', 'gauge',
      [`db_favorites_total ${favCount}`]
    ));

    // 6. Last scraper run
    const lastScrape = await prisma.scraperLog.findFirst({
      orderBy: { startedAt: 'desc' },
    });
    if (lastScrape) {
      output.push(prom('scraper_last_run_timestamp', 'Timestamp of last scraper run', 'gauge',
        [`scraper_last_run_timestamp ${new Date(lastScrape.startedAt).getTime() / 1000}`]
      ));
      output.push(prom('scraper_last_added', 'Opportunities added in last scraper run', 'gauge',
        [`scraper_last_added ${lastScrape.added}`]
      ));
      output.push(prom('scraper_status', 'Last scraper run status (1=success, 0=error)', 'gauge',
        [`scraper_status ${lastScrape.status === 'success' ? 1 : 0}`]
      ));
    }
  } catch {
    // DB might be unavailable — skip DB metrics
  }

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(output.join('\n'));
}
