/**
 * Unit tests — Scraper utilities
 * Tests date parsing, money formatting, HTML stripping
 */

import { describe, it, expect } from '@jest/globals';

// ── Helpers (copied from scraper.js) ─────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function parseDeadline(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const d = new Date(cleaned);
    if (!isNaN(d)) return d;
  }
  const months = {
    january:0,february:1,march:2,april:3,may:4,june:5,
    july:6,august:7,september:8,october:9,november:10,december:11
  };
  const m1 = cleaned.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m1 && months[m1[1].toLowerCase()] !== undefined) {
    return new Date(+m1[3], months[m1[1].toLowerCase()], +m1[2]);
  }
  return null;
}

function fmtMoney(n) {
  if (n == null || n === 0) return '—';
  if (n >= 1000) return '$' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return '$' + n;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes basic HTML tags', () => {
    expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
  });

  it('removes script tags and content', () => {
    expect(stripHtml('<script>alert(1)</script>text')).toBe('text');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
  });

  it('collapses multiple spaces', () => {
    expect(stripHtml('<p>  too   many   spaces  </p>')).toBe('too many spaces');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('parseDeadline', () => {
  it('parses ISO format', () => {
    const d = parseDeadline('2026-06-30');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June = 5
    expect(d.getDate()).toBe(30);
  });

  it('parses "June 15, 2026"', () => {
    const d = parseDeadline('June 15, 2026');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(15);
  });

  it('parses "September 1 2026"', () => {
    const d = parseDeadline('September 1 2026');
    expect(d).toBeInstanceOf(Date);
    expect(d.getMonth()).toBe(8); // September = 8
  });

  it('returns null for invalid input', () => {
    expect(parseDeadline(null)).toBeNull();
    expect(parseDeadline('')).toBeNull();
    expect(parseDeadline('not a date')).toBeNull();
  });
});

describe('fmtMoney', () => {
  it('formats thousands as k', () => {
    expect(fmtMoney(15000)).toBe('$15k');
    expect(fmtMoney(150000)).toBe('$150k');
  });

  it('formats partial thousands', () => {
    expect(fmtMoney(12500)).toBe('$12.5k');
  });

  it('formats small amounts', () => {
    expect(fmtMoney(500)).toBe('$500');
  });

  it('returns dash for zero', () => {
    expect(fmtMoney(0)).toBe('—');
    expect(fmtMoney(null)).toBe('—');
  });
});
