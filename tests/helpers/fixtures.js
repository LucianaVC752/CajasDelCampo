const bcrypt = require('bcryptjs');
const { models } = require('./testDb');

async function createUsers() {
  const password = await bcrypt.hash('Password123!', 10);
  const admin = await models.User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password_hash: password,
    role: 'admin'
  });

  const customer = await models.User.create({
    name: 'Test User',
    email: 'user@example.com',
    password_hash: password,
    role: 'customer'
  });

  return { admin, customer };
}

async function createFarmersAndProducts() {
  const farmer = await models.Farmer.create({
    name: 'Farmer Joe',
    email: 'farmer@example.com',
    phone: '+1234567890',
    location: 'Valle del Cauca',
    years_experience: 10,
    specialties: ['fruits', 'vegetables']
  });

  const product = await models.Product.create({
    name: 'Organic Apple',
    description: 'Fresh organic apple',
    price: 2.5,
    unit: 'kg',
    category: 'fruits',
    farmer_id: farmer.farmer_id || farmer.id,
  });

  return { farmer, product };
}

module.exports = { createUsers, createFarmersAndProducts };