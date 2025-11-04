const request = require('supertest');

async function getCsrfToken(app) {
  const res = await request(app).get('/api/csrf-token');
  const cookie = res.headers['set-cookie']?.find((c) => c.includes('XSRF-TOKEN')) || '';
  const token = res.body?.csrfToken;
  return { token, cookie };
}

module.exports = { getCsrfToken };