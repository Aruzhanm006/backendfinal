/**
 * Unit tests — API filter/sort logic
 */

import { describe, it, expect } from '@jest/globals';

// ── Simulated filter logic (mirrors opportunities route) ──────────────────────

function applyFilters(items, { kind, country, field, type, degree, q, deadlineDays } = {}) {
  let list = [...items];

  if (kind) list = list.filter(o => o.kind === kind);
  if (country && country !== 'all') list = list.filter(o => o.country === country);
  if (field && field !== 'all') list = list.filter(o => o.field === field);
  if (type && type !== 'all') list = list.filter(o => o.type === type);
  if (degree && degree !== 'all') list = list.filter(o => o.degree === degree);

  if (deadlineDays) {
    const now = new Date();
    const end = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
    list = list.filter(o => {
      const d = new Date(o.deadline);
      return d >= now && d <= end;
    });
  }

  if (q) {
    const term = q.toLowerCase();
    list = list.filter(o =>
      o.titleRu?.toLowerCase().includes(term) ||
      o.organization?.toLowerCase().includes(term) ||
      o.field?.toLowerCase().includes(term)
    );
  }

  return list;
}

function applySort(items, sort) {
  const list = [...items];
  if (sort === 'deadline') return list.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  if (sort === 'amount') return list.sort((a,b) => b.amount - a.amount);
  return list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ── Test data ─────────────────────────────────────────────────────────────────

const MOCK_OPPORTUNITIES = [
  { id:'1', kind:'grant', titleRu:'Климат грант', organization:'Global Fund', country:'Worldwide', field:'Environment', type:'Research Grant', degree:null, amount:15000, deadline: new Date(Date.now() + 20*86400000).toISOString(), createdAt: new Date('2026-01-01').toISOString() },
  { id:'2', kind:'scholarship', titleRu:'STEM стипендия', organization:'Open Trust', country:'Kazakhstan', field:'STEM', type:'Scholarship', degree:'Master', amount:8000, deadline: new Date(Date.now() + 80*86400000).toISOString(), createdAt: new Date('2026-02-01').toISOString() },
  { id:'3', kind:'competition', titleRu:'Startup Challenge', organization:'Innovation Hub', country:'Worldwide', field:'Startups', type:'Competition', degree:null, amount:50000, deadline: new Date(Date.now() + 40*86400000).toISOString(), createdAt: new Date('2026-03-01').toISOString() },
  { id:'4', kind:'grant', titleRu:'AI Health грант', organization:'HealthTech', country:'EU', field:'AI', type:'Research Grant', degree:null, amount:30000, deadline: new Date(Date.now() + 5*86400000).toISOString(), createdAt: new Date('2026-04-01').toISOString() },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Filter by kind', () => {
  it('filters grants only', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { kind: 'grant' });
    expect(result.every(o => o.kind === 'grant')).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('filters scholarships only', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { kind: 'scholarship' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns all when no kind filter', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES);
    expect(result).toHaveLength(4);
  });
});

describe('Filter by country', () => {
  it('filters by Kazakhstan', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { country: 'Kazakhstan' });
    expect(result).toHaveLength(1);
    expect(result[0].country).toBe('Kazakhstan');
  });

  it('ignores "all" value', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { country: 'all' });
    expect(result).toHaveLength(4);
  });
});

describe('Filter by deadline', () => {
  it('filters within 30 days', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { deadlineDays: 30 });
    // items with deadline within 30 days: id=1 (20d) and id=4 (5d)
    expect(result.length).toBeGreaterThanOrEqual(1);
    result.forEach(o => {
      const daysLeft = (new Date(o.deadline) - new Date()) / 86400000;
      expect(daysLeft).toBeLessThanOrEqual(31);
    });
  });
});

describe('Filter by degree', () => {
  it('filters Master degree', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { degree: 'Master' });
    expect(result).toHaveLength(1);
    expect(result[0].degree).toBe('Master');
  });
});

describe('Text search', () => {
  it('finds by title keyword', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { q: 'startup' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('finds by organization', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { q: 'healthtech' });
    expect(result).toHaveLength(1);
  });

  it('returns empty for no match', () => {
    const result = applyFilters(MOCK_OPPORTUNITIES, { q: 'xyznotfound123' });
    expect(result).toHaveLength(0);
  });
});

describe('Sort', () => {
  it('sorts by amount descending', () => {
    const result = applySort(MOCK_OPPORTUNITIES, 'amount');
    expect(result[0].amount).toBe(50000);
    expect(result[result.length-1].amount).toBeLessThanOrEqual(result[0].amount);
  });

  it('sorts by deadline ascending', () => {
    const result = applySort(MOCK_OPPORTUNITIES, 'deadline');
    for (let i = 1; i < result.length; i++) {
      expect(new Date(result[i].deadline)).toBeGreaterThanOrEqual(new Date(result[i-1].deadline));
    }
  });

  it('sorts newest first by default', () => {
    const result = applySort(MOCK_OPPORTUNITIES, 'newest');
    expect(result[0].id).toBe('4'); // latest createdAt
  });
});
