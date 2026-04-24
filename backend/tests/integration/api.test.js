/**
 * Integration tests — REST API
 * Tests actual HTTP endpoints using Supertest
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Import app without starting the server
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { authRouter } from '../../src/routes/auth.js';
import { opportunitiesRouter } from '../../src/routes/opportunities.js';
import { favoritesRouter } from '../../src/routes/favorites.js';

// ── Test app setup ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use('/api/auth', authRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/favorites', favoritesRouter);
app.get('/api/health', (_, res) => res.json({ ok: true }));

const prisma = new PrismaClient();

// ── Test fixtures ─────────────────────────────────────────────────────────────

const TEST_USER = {
  name: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123!',
};

let authCookie = '';
let testOpportunityId = '';

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // Create a test opportunity
  const op = await prisma.opportunity.create({
    data: {
      kind: 'grant',
      titleRu: 'Тест гранты',
      titleKz: 'Тест гранты KZ',
      organization: 'Test Org',
      deadline: new Date(Date.now() + 60 * 86400000),
      amount: 10000,
      country: 'Kazakhstan',
      field: 'IT',
      type: 'Research Grant',
      descRu: 'Тестовое описание для интеграционных тестов.',
      descKz: 'Тесттік сипаттама.',
      url: 'https://example.com/test',
      source: 'test',
      externalId: `test-${Date.now()}`,
    },
  });
  testOpportunityId = op.id;
});

afterAll(async () => {
  // Cleanup test data
  await prisma.favorite.deleteMany({ where: { opportunity: { source: 'test' } } });
  await prisma.opportunity.deleteMany({ where: { source: 'test' } });
  await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  await prisma.$disconnect();
});

// ── Health check ──────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ── Opportunities API ─────────────────────────────────────────────────────────

describe('GET /api/opportunities', () => {
  it('returns a list of opportunities', async () => {
    const res = await request(app).get('/api/opportunities');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('filters by kind=grant', async () => {
    const res = await request(app).get('/api/opportunities?kind=grant');
    expect(res.status).toBe(200);
    res.body.items.forEach(item => {
      expect(item.kind).toBe('grant');
    });
  });

  it('filters by country', async () => {
    const res = await request(app).get('/api/opportunities?country=Kazakhstan');
    expect(res.status).toBe(200);
    res.body.items.forEach(item => {
      expect(item.country).toBe('Kazakhstan');
    });
  });

  it('returns paginated results', async () => {
    const res = await request(app).get('/api/opportunities?limit=3&page=1');
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(3);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(3);
  });

  it('sorts by amount', async () => {
    const res = await request(app).get('/api/opportunities?sort=amount&limit=5');
    expect(res.status).toBe(200);
    const amounts = res.body.items.map(o => o.amount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeLessThanOrEqual(amounts[i-1]);
    }
  });

  it('rejects invalid query params', async () => {
    const res = await request(app).get('/api/opportunities?limit=9999');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/opportunities/:id', () => {
  it('returns one opportunity', async () => {
    const res = await request(app).get(`/api/opportunities/${testOpportunityId}`);
    expect(res.status).toBe(200);
    expect(res.body.item.id).toBe(testOpportunityId);
    expect(res.body.item.titleRu).toBe('Тест гранты');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/opportunities/nonexistent_id_xyz');
    expect(res.status).toBe(404);
  });
});

// ── Auth API ──────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    // Save auth cookie
    authCookie = res.headers['set-cookie']?.[0] || '';
  });

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('email_taken');
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'new@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'only@email.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
    authCookie = res.headers['set-cookie']?.[0] || '';
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_credentials');
  });

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'somepassword' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── Favorites API ─────────────────────────────────────────────────────────────

describe('Favorites API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/favorites');
    expect(res.status).toBe(401);
  });

  it('returns empty favorites for new user', async () => {
    const res = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('adds opportunity to favorites', async () => {
    const res = await request(app)
      .post(`/api/favorites/${testOpportunityId}/toggle`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(true);
  });

  it('shows saved opportunity in favorites list', async () => {
    const res = await request(app)
      .get('/api/favorites')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.items.some(i => i.id === testOpportunityId)).toBe(true);
  });

  it('removes opportunity from favorites (toggle)', async () => {
    const res = await request(app)
      .post(`/api/favorites/${testOpportunityId}/toggle`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(false);
  });
});
