const request = require('supertest');
const app = require('../../../server');

describe('Health endpoint', () => {
  it('GET /api/health returns status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('environment');
  });
});