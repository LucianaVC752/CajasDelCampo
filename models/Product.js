const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database-sqlite');

const Product = sequelize.define('Product', {
  product_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  farmer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'farmers',
      key: 'farmer_id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'kg',
    validate: {
      isIn: [['kg', 'g', 'lb', 'unidad', 'docena', 'manojo', 'atado']]
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['vegetales', 'frutas', 'hierbas', 'tubérculos', 'legumbres', 'otros']]
    }
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  season_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  season_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  organic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  nutritional_info: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'products'
});

module.exports = Product;
