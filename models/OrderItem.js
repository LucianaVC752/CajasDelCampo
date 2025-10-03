const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-sqlite');

const OrderItem = sequelize.define('OrderItem', {
  order_item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'order_id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'product_id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  price_at_purchase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    },
    defaultValue: 0
  },
  product_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  product_unit: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  farmer_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'order_items',
  hooks: {
    beforeCreate: (orderItem) => {
      // Calculate total price
      orderItem.total_price = orderItem.quantity * orderItem.price_at_purchase;
    },
    beforeUpdate: (orderItem) => {
      if (orderItem.changed('quantity') || orderItem.changed('price_at_purchase')) {
        orderItem.total_price = orderItem.quantity * orderItem.price_at_purchase;
      }
    }
  }
});

module.exports = OrderItem;
