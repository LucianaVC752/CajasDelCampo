const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-sqlite');

const Subscription = sequelize.define('Subscription', {
  subscription_id: {
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
  plan_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  frequency: {
    type: DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'quarterly'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  status: {
    type: DataTypes.ENUM('active', 'paused', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  next_delivery_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  is_hidden: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // El campo paid se manejará a nivel de aplicación, no en la base de datos
  // paid: {
  //   type: DataTypes.BOOLEAN,
  //   allowNull: false,
  //   defaultValue: false
  // },
  box_size: {
    type: DataTypes.ENUM('small', 'medium', 'large'),
    allowNull: false,
    defaultValue: 'medium'
  },
  custom_preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  pause_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'subscriptions',
  hooks: {
    beforeCreate: (subscription) => {
      if (!subscription.next_delivery_date) {
        const nextDelivery = new Date(subscription.start_date);
        switch (subscription.frequency) {
          case 'weekly':
            nextDelivery.setDate(nextDelivery.getDate() + 7);
            break;
          case 'biweekly':
            nextDelivery.setDate(nextDelivery.getDate() + 14);
            break;
          case 'monthly':
            nextDelivery.setMonth(nextDelivery.getMonth() + 1);
            break;
        }
        subscription.next_delivery_date = nextDelivery;
      }
    }
  }
});

module.exports = Subscription;
