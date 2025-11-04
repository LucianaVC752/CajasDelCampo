const { Sequelize } = require('sequelize');
const path = require('path');

const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: isTest ? ':memory:' : path.join(__dirname, '../database.sqlite'),
  logging: isTest ? false : (process.env.NODE_ENV === 'development' ? console.log : false),
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: {
    charset: 'utf8mb4'
  }
});

module.exports = { sequelize };
