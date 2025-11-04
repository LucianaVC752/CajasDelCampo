const request = require('supertest');
const app = require('../../../server');
const { sequelize } = require('../../../config/database-sqlite');
const { User } = require('../../../models');
const bcrypt = require('bcryptjs');

// Helper to get CSRF token and cookie
async function getCsrfToken() {
  const res = await request(app).get('/api/csrf-token');
  const token = res.body && res.body.csrfToken;
  const setCookie = res.headers['set-cookie'] || [];
  const xsrfCookie = setCookie.find((c) => c.startsWith('XSRF-TOKEN='));
  const cookieValue = xsrfCookie ? xsrfCookie.split(';')[0] : `XSRF-TOKEN=${token}`;
  return { token, cookie: cookieValue };
}

describe('POST /api/auth/login', () => {
  const validEmail = 'login.test@example.com';
  const validPassword = 'ValidPass123!';

  beforeAll(async () => {
    // Ensure a clean DB for tests
    await sequelize.sync({ force: true });
    // Create a test user
    await User.create({
      name: 'Login Test User',
      email: validEmail,
      password_hash: await bcrypt.hash(validPassword, 12),
      role: 'customer',
      is_active: true,
      email_verified: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('200 success with valid credentials', async () => {
    const { token, cookie } = await getCsrfToken();
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send({ email: validEmail, password: validPassword })
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', validEmail);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
  });

  test('401 with invalid credentials (wrong password)', async () => {
    const { token, cookie } = await getCsrfToken();
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send({ email: validEmail, password: 'WrongPassword!' })
      .expect(401);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message.toLowerCase()).toContain('invalid');
  });

  test('400 validation error for missing fields', async () => {
    const { token, cookie } = await getCsrfToken();
    const res = await request(app)
      .post('/api/auth/login')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send({ email: validEmail }) // missing password
      .expect(400);

    expect(res.body).toHaveProperty('message', 'Validation errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
    const msgs = res.body.errors.map(e => e.msg.toLowerCase());
    expect(msgs.join(' ')).toContain('password');
  });

  test('Handled error with malformed JSON body', async () => {
    // Malformed JSON will be rejected by express.json before CSRF
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":"bad",') // invalid JSON
      .expect(500);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});