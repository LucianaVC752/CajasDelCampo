const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-sqlite');

const Farmer = sequelize.define('Farmer', {
  farmer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  story: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  contact_info: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  image_data: {
    type: DataTypes.BLOB('long'),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  years_experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  specialties: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() {
      const value = this.getDataValue('specialties');
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return [];
        }
      }
      return value || [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('specialties', JSON.stringify(value));
      } else {
        this.setDataValue('specialties', value);
      }
    }
  }
}, {
  tableName: 'farmers'
});

module.exports = Farmer;
