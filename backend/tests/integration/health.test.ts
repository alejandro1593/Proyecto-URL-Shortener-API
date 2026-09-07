import supertest from 'supertest';
import app from '../../src/app';

describe('API Health Check', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await supertest(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
