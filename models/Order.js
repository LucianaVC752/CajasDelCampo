const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/crypto');
const { sequelize } = require('../config/database-sqlite');

const Order = sequelize.define('Order', {
  order_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Nullable for one-time orders
    references: {
      model: 'subscriptions',
      key: 'subscription_id'
    }
  },
  address_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'addresses',
      key: 'address_id'
    }
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    defaultValue: () => `CDS-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  },
  order_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  delivery_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned'),
    allowNull: false,
    defaultValue: 'pending'
  },
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  delivery_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('delivery_notes');
      const dec = decrypt(raw);
      return dec || null;
    },
    set(val) {
      this.setDataValue('delivery_notes', val == null ? val : encrypt(val));
    }
  },
  special_instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('special_instructions');
      const dec = decrypt(raw);
      return dec || null;
    },
    set(val) {
      this.setDataValue('special_instructions', val == null ? val : encrypt(val));
    }
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('cancellation_reason');
      const dec = decrypt(raw);
      return dec || null;
    },
    set(val) {
      this.setDataValue('cancellation_reason', val == null ? val : encrypt(val));
    }
  }
}, {
  tableName: 'orders',
  hooks: {
    beforeCreate: (order) => {
      // Generate order number
      if (!order.order_number) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        order.order_number = `CDS-${timestamp}-${random}`;
      }
    }
  }
});

module.exports = Order;
