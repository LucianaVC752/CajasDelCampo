const { sequelize } = require('../../config/database-sqlite');
const models = require('../../models');

async function resetDatabase() {
  // Drop and recreate all tables for a clean slate
  await sequelize.sync({ force: true });
}

async function truncateAll() {
  // Truncate all models to cleanup between tests when needed
  const { User, Address, Farmer, Product, Subscription, Order, Payment } = models;
  const tables = [User, Address, Farmer, Product, Subscription, Order, Payment].filter(Boolean);
  for (const model of tables) {
    await model.destroy({ where: {}, truncate: true, cascade: true, force: true });
  }
}

async function closeDatabase() {
  await sequelize.close();
}

module.exports = { resetDatabase, truncateAll, closeDatabase, sequelize, models };