const { sequelize } = require('../config/database-sqlite');
const User = require('./User');
const Address = require('./Address');
const Farmer = require('./Farmer');
const Product = require('./Product');
const Subscription = require('./Subscription');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');

// Define associations
// User associations
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Farmer associations
Farmer.hasMany(Product, { foreignKey: 'farmer_id', as: 'products' });
Product.belongsTo(Farmer, { foreignKey: 'farmer_id', as: 'farmer' });

// Subscription associations
Subscription.hasMany(Order, { foreignKey: 'subscription_id', as: 'orders' });
Order.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

// Order associations
Order.belongsTo(Address, { foreignKey: 'address_id', as: 'address' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'orderItems' });
Order.hasOne(Payment, { foreignKey: 'order_id', as: 'payment' });

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Address associations
Address.hasMany(Order, { foreignKey: 'address_id', as: 'orders' });

// Product associations
Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'orderItems' });

module.exports = {
  sequelize,
  User,
  Address,
  Farmer,
  Product,
  Subscription,
  Order,
  OrderItem,
  Payment
};
