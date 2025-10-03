const { sequelize } = require('./config/database-sqlite');
const User = require('./models/User');
const Product = require('./models/Product');
const Farmer = require('./models/Farmer');
const Subscription = require('./models/Subscription');
const Address = require('./models/Address');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const Payment = require('./models/Payment');
const bcrypt = require('bcryptjs');

async function createDatabase() {
  try {
    console.log('🔄 Sincronizando base de datos...');
    
    // Sincronizar sin forzar para evitar problemas
    await sequelize.sync();
    console.log('✅ Base de datos sincronizada correctamente');
    
    // Verificar si ya existen usuarios
    const existingAdmin = await User.findOne({ where: { email: 'admin@cajasdelcampo.com' } });
    const existingTestUser = await User.findOne({ where: { email: 'test@example.com' } });
    
    if (!existingAdmin) {
      console.log('🔄 Creando usuario administrador...');
      const adminUser = await User.create({
        name: 'Administrador',
        email: 'admin@cajasdelcampo.com',
        password_hash: await bcrypt.hash('admin123', 12),
        role: 'admin',
        is_active: true,
        email_verified: true
      });
      console.log('✅ Usuario administrador creado:', adminUser.email);
    } else {
      console.log('ℹ️ Usuario administrador ya existe');
    }
    
    if (!existingTestUser) {
      console.log('🔄 Creando usuario de prueba...');
      const testUser = await User.create({
        name: 'Usuario de Prueba',
        email: 'test@example.com',
        password_hash: await bcrypt.hash('test123', 12),
        role: 'customer',
        is_active: true,
        email_verified: true
      });
      console.log('✅ Usuario de prueba creado:', testUser.email);
    } else {
      console.log('ℹ️ Usuario de prueba ya existe');
    }
    
    // Crear campesinos de ejemplo primero
    const existingFarmers = await Farmer.count();
    let farmers = [];
    if (existingFarmers === 0) {
      console.log('🔄 Creando campesinos de ejemplo...');
      farmers = await Farmer.bulkCreate([
        {
          name: 'Juan Pérez',
          email: 'juan@campo.com',
          phone: '+57 300 123 4567',
          location: 'Vereda El Paraíso, Cundinamarca',
          specialties: JSON.stringify(['vegetables', 'organic']),
          description: 'Campesino con 20 años de experiencia en agricultura orgánica',
          is_active: true
        },
        {
          name: 'María González',
          email: 'maria@campo.com',
          phone: '+57 310 987 6543',
          location: 'Finca La Esperanza, Boyacá',
          specialties: JSON.stringify(['fruits', 'herbs']),
          description: 'Especialista en frutas tropicales y hierbas aromáticas',
          is_active: true
        }
      ]);
      console.log('✅ Campesinos creados:', farmers.length);
    } else {
      console.log('ℹ️ Campesinos ya existen');
      farmers = await Farmer.findAll();
    }
    
    // Crear productos de ejemplo
    const existingProducts = await Product.count();
    if (existingProducts === 0 && farmers.length > 0) {
      console.log('🔄 Creando productos de ejemplo...');
      const products = await Product.bulkCreate([
        {
          farmer_id: farmers[0].farmer_id,
          name: 'Tomates Orgánicos',
          description: 'Tomates frescos cultivados sin pesticidas',
          price: 2500,
          category: 'vegetales',
          stock_quantity: 50,
          unit: 'kg',
          is_available: true,
          organic: true
        },
        {
          farmer_id: farmers[0].farmer_id,
          name: 'Lechuga Hidropónica',
          description: 'Lechuga fresca cultivada en sistema hidropónico',
          price: 1800,
          category: 'vegetales',
          stock_quantity: 30,
          unit: 'unidad',
          is_available: true,
          organic: false
        },
        {
          farmer_id: farmers[1].farmer_id,
          name: 'Zanahorias Orgánicas',
          description: 'Zanahorias frescas y dulces',
          price: 2000,
          category: 'vegetales',
          stock_quantity: 40,
          unit: 'kg',
          is_available: true,
          organic: true
        }
      ]);
      console.log('✅ Productos creados:', products.length);
    } else {
      console.log('ℹ️ Productos ya existen');
    }
    
    // Crear suscripciones de ejemplo
    const existingSubscriptions = await Subscription.count();
    if (existingSubscriptions === 0) {
      console.log('🔄 Creando suscripciones de ejemplo...');
      
      // Obtener usuario de prueba
      const testUser = await User.findOne({ where: { email: 'test@example.com' } });
      
      if (testUser) {
        const subscriptions = await Subscription.bulkCreate([
          {
            user_id: testUser.user_id,
            plan_name: 'Caja Básica',
            frequency: 'monthly',
            status: 'active',
            price: 15000,
            box_size: 'medium',
            custom_preferences: JSON.stringify({})
          },
          {
            user_id: testUser.user_id,
            plan_name: 'Caja Premium',
            frequency: 'monthly',
            status: 'active',
            price: 25000,
            box_size: 'large',
            custom_preferences: JSON.stringify({})
          }
        ]);
        console.log('✅ Suscripciones creadas:', subscriptions.length);
      } else {
        console.log('⚠️ No se encontró usuario de prueba para crear suscripciones');
      }
    } else {
      console.log('ℹ️ Suscripciones ya existen');
    }
    
    // Crear direcciones de ejemplo
    const existingAddresses = await Address.count();
    let testAddress = null;
    if (existingAddresses === 0) {
      console.log('🔄 Creando direcciones de ejemplo...');
      
      // Obtener usuario de prueba
      const testUser = await User.findOne({ where: { email: 'test@example.com' } });
      
      if (testUser) {
        testAddress = await Address.create({
          user_id: testUser.user_id,
          address_line1: 'Calle 123 #45-67',
          address_line2: 'Apartamento 201',
          city: 'Bogotá',
          department: 'Cundinamarca',
          postal_code: '110111',
          details: 'Casa con portón azul',
          is_default: true,
          contact_name: 'Usuario de Prueba',
          contact_phone: '+57 300 123 4567'
        });
        console.log('✅ Dirección de ejemplo creada');
      }
    } else {
      console.log('ℹ️ Direcciones ya existen');
      testAddress = await Address.findOne();
    }
    
    // Crear órdenes de ejemplo
    const existingOrders = await Order.count();
    if (existingOrders === 0 && testAddress) {
      console.log('🔄 Creando órdenes de ejemplo...');
      
      // Obtener usuario de prueba
      const testUser = await User.findOne({ where: { email: 'test@example.com' } });
      const products = await Product.findAll({ limit: 2 });
      
      if (testUser && products.length > 0) {
        // Calcular subtotal
        let subtotal = 0;
        for (const product of products) {
          const quantity = Math.floor(Math.random() * 3) + 1;
          subtotal += product.price * quantity;
        }
        
        const taxAmount = subtotal * 0.19; // IVA 19%
        const shippingCost = 5000; // Costo de envío fijo
        const totalAmount = subtotal + taxAmount + shippingCost;
        
        // Crear orden
        const order = await Order.create({
          user_id: testUser.user_id,
          address_id: testAddress.address_id,
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días desde ahora
          subtotal: subtotal,
          tax_amount: taxAmount,
          shipping_cost: shippingCost,
          total_amount: totalAmount,
          status: 'completed',
          delivery_notes: 'Entregar en horario de oficina'
        });
        
        // Crear items de la orden
        for (const product of products) {
          const quantity = Math.floor(Math.random() * 3) + 1;
          
          // Obtener información del campesino
          const farmer = await Farmer.findByPk(product.farmer_id);
          
          await OrderItem.create({
            order_id: order.order_id,
            product_id: product.product_id,
            quantity: quantity,
            price_at_purchase: product.price,
            product_name: product.name,
            product_unit: product.unit,
            farmer_name: farmer ? farmer.name : 'Campesino Desconocido'
          });
        }
        
        console.log('✅ Orden de ejemplo creada');
      }
    } else {
      console.log('ℹ️ Órdenes ya existen');
    }
    
    console.log('🎉 Base de datos creada y poblada exitosamente');
    
  } catch (error) {
    console.error('❌ Error creando la base de datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = createDatabase;
