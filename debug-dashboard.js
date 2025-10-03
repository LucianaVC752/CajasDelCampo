const axios = require('axios');

const debugDashboard = async () => {
  try {
    console.log('🔄 Debugging dashboard...');
    
    // Login as admin
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@cajasdelcampo.com',
      password: 'Password123'
    });
    const adminToken = adminLogin.data.accessToken;
    console.log('✅ Admin login successful');
    
    // Test dashboard with error details
    try {
      const dashboard = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('✅ Dashboard API successful');
    } catch (error) {
      console.error('❌ Dashboard error:', error.response?.data || error.message);
      console.error('Status:', error.response?.status);
      console.error('Headers:', error.response?.headers);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

debugDashboard();
