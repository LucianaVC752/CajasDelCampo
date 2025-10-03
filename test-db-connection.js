const { sequelize } = require('./config/database-sqlite');

const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const users = await sequelize.query('SELECT COUNT(*) as count FROM users', { type: sequelize.QueryTypes.SELECT });
    console.log('✅ Database query successful:', users[0].count, 'users found');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await sequelize.close();
  }
};

testConnection();
