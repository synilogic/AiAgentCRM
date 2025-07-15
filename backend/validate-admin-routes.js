console.log('🔍 Validating admin routes file...\n');

try {
  // Try to require the admin routes
  const adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes file loaded successfully');
  console.log('✅ Router object type:', typeof adminRoutes);
  
  // Check if it's an Express router
  if (adminRoutes && adminRoutes.stack) {
    console.log('✅ Express router detected');
    console.log(`📊 Total routes registered: ${adminRoutes.stack.length}`);
    
    // List all registered routes
    console.log('\n📋 Registered routes:');
    adminRoutes.stack.forEach((layer, index) => {
      const route = layer.route;
      if (route) {
        const methods = Object.keys(route.methods).join(', ').toUpperCase();
        console.log(`  ${index + 1}. ${methods} ${route.path}`);
      } else {
        console.log(`  ${index + 1}. Middleware: ${layer.name || 'anonymous'}`);
      }
    });
  } else {
    console.log('❌ Not a valid Express router');
  }
  
} catch (error) {
  console.error('❌ Error loading admin routes:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
  
  if (error instanceof SyntaxError) {
    console.error('\n🚨 SYNTAX ERROR DETECTED in admin routes file!');
  }
} 