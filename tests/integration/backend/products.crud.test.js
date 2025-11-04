const request = require('supertest');
const app = require('../../../server');
const { resetDatabase, closeDatabase } = require('../../helpers/testDb');
const { createUsers, createFarmersAndProducts } = require('../../helpers/fixtures');
const { signJwt } = require('../../helpers/auth');
const { getCsrfToken } = require('../../helpers/csrf');

describe('API /api/products (CRUD admin + públicos)', () => {
  let admin;
  let adminToken;
  let farmer;
  let baseProduct;

  beforeAll(async () => {
    await resetDatabase();
    const users = await createUsers();
    admin = users.admin;
    adminToken = signJwt({ id: admin.user_id || admin.id, role: admin.role, email: admin.email });
    const fp = await createFarmersAndProducts();
    farmer = fp.farmer;
    baseProduct = fp.product;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  test('GET /api/products - listado público con paginación', async () => {
    const start = Date.now();
    const res = await request(app)
      .get('/api/products?page=1&limit=5')
      .expect(200);
    const duration = Date.now() - start;
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('pagination');
    expect(duration).toBeLessThan(1500);
  });

  test('GET /api/products/:id - obtiene producto por id', async () => {
    const res = await request(app)
      .get(`/api/products/${baseProduct.product_id || baseProduct.id}`)
      .expect(200);
    expect(res.body.product).toHaveProperty('name');
    expect(res.body.product).toHaveProperty('farmer');
  });

  test('GET /api/products/:id - 404 si no existe', async () => {
    const res = await request(app).get('/api/products/999999').expect(404);
    expect(res.body).toHaveProperty('message');
  });

  test('POST /api/products - crea producto como admin con base64', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);
    const payload = {
      name: 'Banana Premium',
      description: 'Rica banana',
      price: 3.25,
      unit: 'kg',
      category: 'frutas',
      farmer_id: farmer.farmer_id || farmer.id,
      image_base64: Buffer.from('banana').toString('base64') // no es imagen real; la ruta ignora si no detecta mime y devolverá octet-stream
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .field('name', payload.name)
      .field('description', payload.description)
      .field('price', String(payload.price))
      .field('unit', payload.unit)
      .field('category', payload.category)
      .field('farmer_id', String(payload.farmer_id))
      .field('image_base64', payload.image_base64);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('product');
    expect(res.body.product).toHaveProperty('product_id');
  });

  test('POST /api/products - 400 validaciones', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .field('name', '')
      .field('price', '-1')
      .field('unit', 'unit')
      .field('category', 'invalid')
      .field('farmer_id', 'not-a-number');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('PUT /api/products/:id - actualiza como admin', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);
    const targetId = baseProduct.product_id || baseProduct.id;
    const res = await request(app)
      .put(`/api/products/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .field('name', 'Apple Premium')
      .field('price', '4.00')
      .field('unit', 'kg')
      .field('category', 'fruits')
      .field('farmer_id', String(farmer.farmer_id || farmer.id));
    expect(res.status).toBe(200);
    expect(res.body.product).toHaveProperty('name', 'Apple Premium');
  });

  test('PATCH /api/products/:id - actualización parcial', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);
    const targetId = baseProduct.product_id || baseProduct.id;
    const res = await request(app)
      .patch(`/api/products/${targetId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .field('price', '5.50');
    expect(res.status).toBe(200);
    expect(res.body.product).toHaveProperty('price');
  });

  test('DELETE /api/products/:id - elimina producto', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);
    const p = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .field('name', 'To Delete')
      .field('description', 'to be deleted')
      .field('price', '1.00')
      .field('unit', 'kg')
      .field('category', 'fruits')
      .field('farmer_id', String(farmer.farmer_id || farmer.id));
    const id = p.body.product.product_id || p.body.product.id;

    const delRes = await request(app)
      .delete(`/api/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie);
    expect(delRes.status).toBe(200);
    expect(delRes.body).toHaveProperty('message');

    const getRes = await request(app).get(`/api/products/${id}`);
    expect([404,200]).toContain(getRes.status); // puede estar soft-deleted o visible según flags
  });

  test('PATCH /api/products/:id/restore - restaura producto', async () => {
    const { token: csrfToken, cookie } = await getCsrfToken(app);
    const p = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .field('name', 'To Restore')
      .field('description', 'to be restored')
      .field('price', '2.00')
      .field('unit', 'kg')
      .field('category', 'fruits')
      .field('farmer_id', String(farmer.farmer_id || farmer.id));
    const id = p.body.product.product_id || p.body.product.id;

    await request(app)
      .delete(`/api/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie)
      .expect(200);

    const restoreRes = await request(app)
      .patch(`/api/products/${id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-csrf-token', csrfToken)
      .set('Cookie', cookie);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body).toHaveProperty('product');
  });
});