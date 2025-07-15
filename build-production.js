#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building AI Agent CRM for Production...\n');

// Function to execute commands
function execCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Running: ${command}`);
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr && !stderr.includes('warning')) {
                console.error(`⚠️  stderr: ${stderr}`);
            }
            console.log(`✅ ${stdout}`);
            resolve(stdout);
        });
    });
}

// Function to check if directory exists
function checkDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.error(`❌ Directory ${dir} does not exist`);
        return false;
    }
    return true;
}

async function buildProduction() {
    try {
        console.log('='.repeat(50));
        console.log('Building Backend...');
        console.log('='.repeat(50));
        
        if (checkDirectory('./backend')) {
            await execCommand('npm ci --only=production', './backend');
            console.log('✅ Backend dependencies installed\n');
        }

        console.log('='.repeat(50));
        console.log('Building User Frontend...');
        console.log('='.repeat(50));
        
        if (checkDirectory('./frontend-user')) {
            await execCommand('npm ci', './frontend-user');
            await execCommand('npm run build', './frontend-user');
            console.log('✅ User Frontend built successfully\n');
        }

        console.log('='.repeat(50));
        console.log('Building Admin Frontend...');
        console.log('='.repeat(50));
        
        if (checkDirectory('./frontend-admin')) {
            await execCommand('npm ci', './frontend-admin');
            await execCommand('npm run build', './frontend-admin');
            console.log('✅ Admin Frontend built successfully\n');
        }

        console.log('='.repeat(60));
        console.log('🎉 PRODUCTION BUILD COMPLETED SUCCESSFULLY! 🎉');
        console.log('='.repeat(60));
        console.log('Build artifacts:');
        console.log('📁 Backend: Ready for deployment');
        console.log('📁 User Frontend: ./frontend-user/build/');
        console.log('📁 Admin Frontend: ./frontend-admin/build/');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Production build failed:', error.message);
        process.exit(1);
    }
}

// Run the build
buildProduction(); 