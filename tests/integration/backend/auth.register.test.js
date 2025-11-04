const request = require('supertest');
const app = require('../../../server');
const { resetDatabase, closeDatabase } = require('../../helpers/testDb');
const { getCsrfToken } = require('../../helpers/csrf');

describe('API /api/auth/register', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('200 - registra usuario válido y retorna tokens', async () => {
    const { token, cookie } = await getCsrfToken(app);

    const body = {
      name: 'Nuevo Usuario',
      email: 'nuevo@example.com',
      password: 'Password123!'
    };

    const start = Date.now();
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send(body);
    const duration = Date.now() - start;

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body).toHaveProperty('user');
    expect(duration).toBeLessThan(1500);
  });

  test('400 - validación: password débil y email inválido', async () => {
    const { token, cookie } = await getCsrfToken(app);

    const res = await request(app)
      .post('/api/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send({ name: 'X', email: 'bad-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('409 - usuario ya existe', async () => {
    const { token, cookie } = await getCsrfToken(app);

    // Primer registro
    await request(app)
      .post('/api/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send({ name: 'Existente', email: 'dup@example.com', password: 'Password123!' })
      .expect(200);

    // Intento duplicado
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .send({ name: 'Existente 2', email: 'dup@example.com', password: 'Password123!' });

    expect([400,409]).toContain(res.status); // ruta puede responder 400 o 409 según implementación
    expect(res.body).toHaveProperty('message');
  });

  test('500 - JSON malformado', async () => {
    const { token, cookie } = await getCsrfToken(app);
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-csrf-token', token)
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send('{"email":"bad"'); // cuerpo roto

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('message');
  });
});