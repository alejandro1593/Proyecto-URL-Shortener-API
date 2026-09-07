import supertest from 'supertest';

jest.mock('../../src/config/database', () => ({
  pool: { query: jest.fn(), end: jest.fn() },
}));
jest.mock('../../src/config/redis', () => ({
  redis: {},
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn(),
  cacheDelete: jest.fn(),
}));

import app from '../../src/app';
import { pool } from '../../src/config/database';
import { hashPassword } from '../../src/utils/helpers';

const mockPool = pool as jest.Mocked<typeof pool>;
const mockQuery = mockPool.query as jest.Mock;

function pgResult(rows: any[] = []) {
  return { rows, rowCount: rows.length, command: '', oid: 0, fields: [] } as any;
}

describe('Auth Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/auth/register', () => {
    test('returns 201 on success', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([]))
        .mockResolvedValueOnce(pgResult([{
          id: 'uuid-1', full_name: 'Test User', email: 'test@example.com', role: 'user', created_at: new Date(),
        }]))
        .mockResolvedValueOnce(pgResult());

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ fullName: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    test('returns 409 when email exists', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([{ id: 'existing' }]));

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ fullName: 'Test User', email: 'dup@example.com', password: 'password123' });

      expect(res.status).toBe(409);
    });

    test('returns 400 with invalid email', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ fullName: 'Test User', email: 'bad', password: 'password123' });

      expect(res.status).toBe(400);
    });

    test('returns 400 with short password', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ fullName: 'Test User', email: 'a@b.com', password: '12' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('returns 200 on success', async () => {
      const hash = await hashPassword('password123');
      mockQuery
        .mockResolvedValueOnce(pgResult([{
          id: 'uuid-1', full_name: 'Test', email: 't@t.com', password_hash: hash, role: 'user', is_active: true,
        }]))
        .mockResolvedValueOnce(pgResult());

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 't@t.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    test('returns 401 with wrong password', async () => {
      const hash = await hashPassword('password123');
      mockQuery.mockResolvedValueOnce(pgResult([{
        id: 'uuid-1', full_name: 'Test', email: 't@t.com', password_hash: hash, role: 'user', is_active: true,
      }]));

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 't@t.com', password: 'wrong' });

      expect(res.status).toBe(401);
    });

    test('returns 401 with unknown email', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'no@no.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('returns 200 with new tokens', async () => {
      mockQuery
        .mockResolvedValueOnce(pgResult([{
          id: 't1', user_id: 'uuid-1', token: 'valid-refresh', expires_at: new Date(Date.now() + 86400000), revoked: false,
        }]))
        .mockResolvedValueOnce(pgResult([{
          id: 'uuid-1', full_name: 'Test', email: 't@t.com', is_active: true,
        }]))
        .mockResolvedValueOnce(pgResult())
        .mockResolvedValueOnce(pgResult());

      const res = await supertest(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    test('returns 401 with invalid token', async () => {
      mockQuery.mockResolvedValueOnce(pgResult([]));

      const res = await supertest(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid' });

      expect(res.status).toBe(401);
    });
  });
});
