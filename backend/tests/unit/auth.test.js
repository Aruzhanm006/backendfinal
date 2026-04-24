/**
 * Unit tests — Authentication logic
 * Tests password hashing, JWT signing, and validation utils
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Password strength (copied logic) ──────────────────────────────────────────

const WEAK_PASSWORDS = new Set([
  '123456','12345678','password','qwerty','111111',
  '000000','123456789','abc123','1234','1234567'
]);

function passwordStrength(pw) {
  if (!pw || pw.length < 6) return 0;
  if (WEAK_PASSWORDS.has(pw.toLowerCase())) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Password strength', () => {
  it('returns 0 for weak passwords', () => {
    expect(passwordStrength('123456')).toBe(0);
    expect(passwordStrength('password')).toBe(0);
    expect(passwordStrength('qwerty')).toBe(0);
  });

  it('returns 0 for too short passwords', () => {
    expect(passwordStrength('abc')).toBe(0);
    expect(passwordStrength('')).toBe(0);
  });

  it('returns 1 for simple 8+ char passwords', () => {
    expect(passwordStrength('hello123')).toBeGreaterThanOrEqual(1);
  });

  it('returns 3 for strong passwords', () => {
    expect(passwordStrength('MyStr0ng!Pass')).toBe(3);
    expect(passwordStrength('C0mpl3x@Secret!')).toBe(3);
  });

  it('increases score with special characters', () => {
    const basic = passwordStrength('Hello123');
    const withSpecial = passwordStrength('Hello123!');
    expect(withSpecial).toBeGreaterThan(basic);
  });
});

describe('Password hashing (bcrypt)', () => {
  it('hashes a password', async () => {
    const hash = await bcrypt.hash('testpassword', 10);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe('testpassword');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies correct password', async () => {
    const pw = 'MyTestPass123!';
    const hash = await bcrypt.hash(pw, 10);
    const ok = await bcrypt.compare(pw, hash);
    expect(ok).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    const ok = await bcrypt.compare('wrongpassword', hash);
    expect(ok).toBe(false);
  });

  it('different hashes for same password (salt)', async () => {
    const pw = 'samepassword';
    const h1 = await bcrypt.hash(pw, 10);
    const h2 = await bcrypt.hash(pw, 10);
    expect(h1).not.toBe(h2); // different salts
  });
});

describe('JWT tokens', () => {
  const SECRET = 'test_secret_32_chars_minimum_here!';

  it('signs and verifies a token', () => {
    const payload = { sub: 'user123', role: 'USER' };
    const token = jwt.sign(payload, SECRET, { expiresIn: '7d' });
    const decoded = jwt.verify(token, SECRET);
    expect(decoded.sub).toBe('user123');
    expect(decoded.role).toBe('USER');
  });

  it('throws on wrong secret', () => {
    const token = jwt.sign({ sub: 'user123' }, SECRET);
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });

  it('throws on expired token', () => {
    const token = jwt.sign({ sub: 'user123' }, SECRET, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, SECRET)).toThrow(/expired/i);
  });

  it('token contains expected fields', () => {
    const token = jwt.sign({ sub: 'abc', role: 'ADMIN' }, SECRET);
    const decoded = jwt.verify(token, SECRET);
    expect(decoded).toHaveProperty('sub', 'abc');
    expect(decoded).toHaveProperty('role', 'ADMIN');
    expect(decoded).toHaveProperty('iat');
  });
});
