const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/crypto');
const { sequelize } = require('../config/database-sqlite');

const Payment = sequelize.define('Payment', {
  payment_id: {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  payment_method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'cash_on_delivery', 'pse', 'google_pay', 'bank_transfer'),
    allowNull: false
  },
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const raw = this.getDataValue('gateway_response');
      const dec = decrypt(raw);
      return dec || null;
    },
    set(val) {
      if (val === null || val === undefined) {
        this.setDataValue('gateway_response', val);
      } else {
        const str = typeof val === 'string' ? val : JSON.stringify(val);
        this.setDataValue('gateway_response', encrypt(str));
      }
    }
  },
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('failure_reason');
      const dec = decrypt(raw);
      return dec || null;
    },
    set(val) {
      this.setDataValue('failure_reason', val == null ? val : encrypt(val));
    }
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  refund_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('refund_reason');
      const dec = decrypt(raw);
      return dec || null;
    },
    set(val) {
      this.setDataValue('refund_reason', val == null ? val : encrypt(val));
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'COP'
  },
  gateway_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'payments'
});

module.exports = Payment;
