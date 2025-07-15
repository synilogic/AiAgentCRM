console.log('🔍 Checking specific admin routes...\n');

try {
  const adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded successfully');
  
  const targetRoutes = ['/staff', '/addon-modules', '/system-settings', '/support'];
  const registeredRoutes = [];
  
  // Extract all route paths
  if (adminRoutes && adminRoutes.stack) {
    adminRoutes.stack.forEach((layer) => {
      if (layer.route) {
        registeredRoutes.push(layer.route.path);
      }
    });
    
    console.log(`📊 Total routes found: ${registeredRoutes.length}`);
    console.log('\n🔍 Checking target routes:');
    
    targetRoutes.forEach(targetRoute => {
      const isRegistered = registeredRoutes.includes(targetRoute);
      console.log(`  ${targetRoute}: ${isRegistered ? '✅ FOUND' : '❌ MISSING'}`);
    });
    
    console.log('\n📋 All registered routes:');
    registeredRoutes.forEach((route, index) => {
      const marker = targetRoutes.includes(route) ? ' 🎯' : '';
      console.log(`  ${index + 1}. ${route}${marker}`);
    });
    
    // Check if our target routes are at the end
    const lastFewRoutes = registeredRoutes.slice(-10);
    console.log('\n📋 Last 10 routes:');
    lastFewRoutes.forEach(route => {
      const marker = targetRoutes.includes(route) ? ' 🎯' : '';
      console.log(`  ${route}${marker}`);
    });
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 