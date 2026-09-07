import {
  generateShortCode,
  normalizeUrl,
  generateToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
} from '../../src/utils/helpers';
import jwt from 'jsonwebtoken';

describe('Utility functions', () => {
  describe('generateShortCode', () => {
    test('returns a string of default length 7', () => {
      const code = generateShortCode();
      expect(typeof code).toBe('string');
      expect(code.length).toBe(7);
    });

    test('returns unique codes', () => {
      const codes = new Set(Array.from({ length: 100 }, () => generateShortCode()));
      expect(codes.size).toBe(100);
    });

    test('returns custom length', () => {
      const code = generateShortCode(5);
      expect(code.length).toBe(5);
    });

    test('only contains alphanumeric characters', () => {
      const code = generateShortCode();
      expect(code).toMatch(/^[a-zA-Z0-9]+$/);
    });
  });

  describe('normalizeUrl', () => {
    test('adds https:// when missing', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    test('keeps existing http:// protocol', () => {
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    test('keeps existing https:// protocol', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    test('handles URLs with paths', () => {
      expect(normalizeUrl('example.com/path/to/page')).toBe('https://example.com/path/to/page');
    });
  });

  describe('JWT functions', () => {
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

    test('generateToken returns a valid JWT', () => {
      const token = generateToken('user123', 'test@example.com');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    test('generateRefreshToken returns a valid JWT with type refresh', () => {
      const token = generateRefreshToken('user123');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('user123');
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('Password functions', () => {
    test('hashPassword returns a hash different from the plain text', async () => {
      const hash = await hashPassword('mypassword');
      expect(hash).not.toBe('mypassword');
      expect(hash.length).toBeGreaterThan(0);
    });

    test('comparePassword returns true for matching password', async () => {
      const hash = await hashPassword('mypassword');
      const result = await comparePassword('mypassword', hash);
      expect(result).toBe(true);
    });

    test('comparePassword returns false for wrong password', async () => {
      const hash = await hashPassword('mypassword');
      const result = await comparePassword('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });
});
