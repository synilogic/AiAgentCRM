const fs = require('fs');
const path = require('path');

// Demo Razorpay test credentials (replace with your actual test credentials)
const razorpayConfig = {
  RAZORPAY_KEY_ID: 'rzp_test_your_key_id_here',
  RAZORPAY_KEY_SECRET: 'your_key_secret_here',
  RAZORPAY_WEBHOOK_SECRET: 'your_webhook_secret_here',
  RAZORPAY_TEST_MODE: 'true'
};

console.log('🔧 Setting up Razorpay Environment Variables...\n');

// Read existing env.example
const envExamplePath = path.join(__dirname, 'env.example');
const envPath = path.join(__dirname, '.env');

try {
  let envContent = '';
  
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log('✅ Found env.example file');
  } else {
    console.log('⚠️  env.example not found, creating basic template');
  }

  // Update or add Razorpay variables
  Object.entries(razorpayConfig).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`✅ Updated ${key}`);
    } else {
      envContent += `\n${key}=${value}`;
      console.log(`✅ Added ${key}`);
    }
  });

  // Write to .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n🎉 .env file created successfully!');
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to https://dashboard.razorpay.com/signin');
  console.log('2. Create a free test account');
  console.log('3. Go to Settings > API Keys');
  console.log('4. Copy your Test Key ID and Key Secret');
  console.log('5. Replace the values in backend/.env file:');
  console.log('   - RAZORPAY_KEY_ID=your_actual_test_key_id');
  console.log('   - RAZORPAY_KEY_SECRET=your_actual_test_key_secret');
  console.log('6. Restart the backend server');
  
  console.log('\n💡 For now, payment creation will work but actual payments will fail until you add real credentials.');
  
} catch (error) {
  console.error('❌ Error setting up environment:', error.message);
  console.log('\n🔧 Manual Setup Instructions:');
  console.log('1. Create a .env file in the backend directory');
  console.log('2. Add the following variables:');
  Object.entries(razorpayConfig).forEach(([key, value]) => {
    console.log(`   ${key}=${value}`);
  });
} 