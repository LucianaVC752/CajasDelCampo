const axios = require('axios');

const finalVerification = async () => {
  try {
    console.log('🔄 Final system verification...');
    
    // Test 1: Public APIs (no auth required)
    console.log('\n1. Testing public APIs...');
    const productsResponse = await axios.get('http://localhost:5000/api/products');
    console.log('✅ Products API:', productsResponse.data.products.length, 'products found');
    
    const farmersResponse = await axios.get('http://localhost:5000/api/farmers');
    console.log('✅ Farmers API:', farmersResponse.data.farmers.length, 'farmers found');
    
    // Test 2: User authentication
    console.log('\n2. Testing user authentication...');
    const userLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'juan@example.com',
      password: 'Password123'
    });
    const userToken = userLogin.data.accessToken;
    console.log('✅ User login successful');
    
    // Test 3: User APIs
    console.log('\n3. Testing user APIs...');
    const userPayments = await axios.get('http://localhost:5000/api/payments/my-payments', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ User payments API:', userPayments.data.payments.length, 'payments found');
    
    const userSubscriptions = await axios.get('http://localhost:5000/api/subscriptions/my-subscriptions', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ User subscriptions API:', userSubscriptions.data.subscriptions.length, 'subscriptions found');
    
    // Test 4: Admin authentication
    console.log('\n4. Testing admin authentication...');
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@cajasdelcampo.com',
      password: 'Password123'
    });
    const adminToken = adminLogin.data.accessToken;
    console.log('✅ Admin login successful');
    
    // Test 5: Admin APIs
    console.log('\n5. Testing admin APIs...');
    const adminUsers = await axios.get('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin users API:', adminUsers.data.users.length, 'users found');
    
    const adminProducts = await axios.get('http://localhost:5000/api/admin/products', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin products API:', adminProducts.data.products.length, 'products found');
    
    const adminFarmers = await axios.get('http://localhost:5000/api/admin/farmers', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin farmers API:', adminFarmers.data.farmers.length, 'farmers found');
    
    const adminOrders = await axios.get('http://localhost:5000/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin orders API:', adminOrders.data.orders.length, 'orders found');
    
    const adminSubscriptions = await axios.get('http://localhost:5000/api/admin/subscriptions', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin subscriptions API:', adminSubscriptions.data.subscriptions.length, 'subscriptions found');
    
    const adminPayments = await axios.get('http://localhost:5000/api/admin/payments', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Admin payments API:', adminPayments.data.payments.length, 'payments found');
    
    // Test 6: Dashboard API
    console.log('\n6. Testing dashboard API...');
    const dashboard = await axios.get('http://localhost:5000/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Dashboard API successful');
    console.log('   - Total users:', dashboard.data.stats.users.total);
    console.log('   - Total products:', dashboard.data.stats.products.total);
    console.log('   - Total farmers:', dashboard.data.stats.farmers.total);
    console.log('   - Total revenue:', dashboard.data.stats.revenue.total);
    
    console.log('\n🎉 ALL SYSTEMS VERIFIED SUCCESSFULLY!');
    console.log('\n📋 Test Credentials:');
    console.log('👤 Admin: admin@cajasdelcampo.com / Password123');
    console.log('👤 User 1: juan@example.com / Password123');
    console.log('👤 User 2: maria@example.com / Password123');
    console.log('👤 User 3: carlos@example.com / Password123');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.response?.data || error.message);
  }
};

finalVerification();
