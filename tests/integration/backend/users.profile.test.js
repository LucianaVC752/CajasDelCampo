const request = require('supertest');
const app = require('../../../server');
const { resetDatabase, closeDatabase } = require('../../helpers/testDb');
const { createUsers } = require('../../helpers/fixtures');
const { signJwt } = require('../../helpers/auth');
const { getCsrfToken } = require('../../helpers/csrf');

describe('API /api/users/profile', () => {
  let user;
  let token;

  beforeAll(async () => {
    await resetDatabase();
    const { customer } = await createUsers();
    user = customer;
    token = signJwt({ id: user.user_id || user.id, role: user.role, email: user.email });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('200 - obtiene perfil con token válido', async () => {
    const start = Date.now();
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const duration = Date.now() - start;

    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', user.email);
    expect(duration).toBeLessThan(1500);
  });

  test('401 - acceso sin token', async () => {
    const res = await request(app)
      .get('/api/users/profile');
    expect(res.status).toBe(401);
  });

  test('401 - token inválido', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer badtoken');
    expect(res.status).toBe(401);
  });

  test('200 - actualiza perfil (PUT) con CSRF y validación', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .send({ name: 'Usuario Editado', phone_number: '+34999999999' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('name', 'Usuario Editado');
  });

  test('400 - validación errónea al actualizar perfil', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .send({ name: '', phone_number: 'bad-phone' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });
});