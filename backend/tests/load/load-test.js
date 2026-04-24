/**
 * Load test — k6
 * Жүктемелік тест — API өнімділігін тексереді
 *
 * Іске қосу:
 *   k6 run tests/load/load-test.js
 *   k6 run --vus 50 --duration 60s tests/load/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Custom metrics ──────────────────────────────────────────────────────────

const errors = new Counter('errors');
const successRate = new Rate('success_rate');
const apiLatency = new Trend('api_latency', true);

// ── Test config ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '60s', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 100 },  // Peak: 100 users
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    // 95% of requests must complete within 500ms
    http_req_duration: ['p(95)<500'],
    // Less than 1% errors
    success_rate: ['rate>0.99'],
    // Error counter stays low
    errors: ['count<10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Scenarios ───────────────────────────────────────────────────────────────

export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // 1. Health check
  group('Health', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    const ok = check(res, {
      'status 200': r => r.status === 200,
      'response ok': r => r.json('ok') === true,
      'latency < 100ms': r => r.timings.duration < 100,
    });
    if (!ok) errors.add(1);
    successRate.add(ok);
    apiLatency.add(res.timings.duration);
  });

  sleep(0.5);

  // 2. List opportunities
  group('List opportunities', () => {
    const res = http.get(`${BASE_URL}/api/opportunities?limit=20&sort=newest`);
    const ok = check(res, {
      'status 200': r => r.status === 200,
      'has items': r => r.json('items') !== null,
      'latency < 300ms': r => r.timings.duration < 300,
    });
    if (!ok) errors.add(1);
    successRate.add(ok);
    apiLatency.add(res.timings.duration);
  });

  sleep(0.3);

  // 3. Filter by country
  group('Filter by country', () => {
    const res = http.get(`${BASE_URL}/api/opportunities?country=Kazakhstan&kind=grant`);
    const ok = check(res, {
      'status 200': r => r.status === 200,
      'latency < 400ms': r => r.timings.duration < 400,
    });
    if (!ok) errors.add(1);
    successRate.add(ok);
  });

  sleep(0.5);

  // 4. Search
  group('Text search', () => {
    const terms = ['AI', 'climate', 'Kazakhstan', 'scholarship', 'grant'];
    const term = terms[Math.floor(Math.random() * terms.length)];
    const res = http.get(`${BASE_URL}/api/opportunities?q=${term}`);
    const ok = check(res, {
      'status 200': r => r.status === 200,
      'latency < 400ms': r => r.timings.duration < 400,
    });
    if (!ok) errors.add(1);
    successRate.add(ok);
  });

  sleep(1);
}

// ── Summary output ──────────────────────────────────────────────────────────

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const rps = data.metrics.http_reqs?.values?.rate || 0;
  const errRate = 1 - (data.metrics.success_rate?.values?.rate || 1);

  console.log('\n=== Load Test Summary ===');
  console.log(`Requests/sec: ${rps.toFixed(1)}`);
  console.log(`p95 latency:  ${p95.toFixed(0)}ms`);
  console.log(`Error rate:   ${(errRate * 100).toFixed(2)}%`);
  console.log('========================\n');

  return {
    'test-results/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
