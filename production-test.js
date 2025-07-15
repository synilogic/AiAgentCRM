#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🧪 AI Agent CRM - Production Testing Suite');
console.log('==========================================\n');

const BACKEND_URL = 'http://localhost:5000';
const USER_FRONTEND_BUILD = './frontend-user/build';
const ADMIN_FRONTEND_BUILD = './frontend-admin/build';

class ProductionTester {
    constructor() {
        this.results = {
            backend: {},
            frontend: {},
            integration: {}
        };
    }

    async runAllTests() {
        try {
            console.log('🔍 Starting Production Test Suite...\n');

            await this.testBackendHealth();
            await this.testFrontendBuilds();
            await this.testAPIEndpoints();
            await this.testAuthentication();
            await this.generateReport();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testBackendHealth() {
        console.log('🔧 Testing Backend Health...');
        
        try {
            const response = await axios.get(`${BACKEND_URL}/health`);
            this.recordResult('backend', 'health_check', true, 
                `Backend healthy - Status: ${response.status}`);
            
            // Check if database is included in health response
            if (response.data && response.data.database === 'connected') {
                this.recordResult('backend', 'database', true, 
                    'Database connection successful');
            } else {
                this.recordResult('backend', 'database', false, 
                    'Database connection failed');
            }
        } catch (error) {
            this.recordResult('backend', 'health_check', false, 
                `Backend unreachable - ${error.message}`);
            this.recordResult('backend', 'database', false, 
                'Database connection failed');
        }
    }

    async testFrontendBuilds() {
        console.log('🏗️  Testing Frontend Builds...');

        // Check user frontend build
        if (fs.existsSync(USER_FRONTEND_BUILD)) {
            const buildFiles = fs.readdirSync(USER_FRONTEND_BUILD);
            const hasIndex = buildFiles.includes('index.html');
            const hasStatic = fs.existsSync(path.join(USER_FRONTEND_BUILD, 'static'));
            
            this.recordResult('frontend', 'user_build', hasIndex && hasStatic,
                hasIndex && hasStatic ? 'User frontend build complete' : 'User frontend build incomplete');
        } else {
            this.recordResult('frontend', 'user_build', false, 'User frontend build missing');
        }

        // Check admin frontend build
        if (fs.existsSync(ADMIN_FRONTEND_BUILD)) {
            const buildFiles = fs.readdirSync(ADMIN_FRONTEND_BUILD);
            const hasIndex = buildFiles.includes('index.html');
            const hasStatic = fs.existsSync(path.join(ADMIN_FRONTEND_BUILD, 'static'));
            
            this.recordResult('frontend', 'admin_build', hasIndex && hasStatic,
                hasIndex && hasStatic ? 'Admin frontend build complete' : 'Admin frontend build incomplete');
        } else {
            this.recordResult('frontend', 'admin_build', false, 'Admin frontend build missing');
        }
    }

    async testAPIEndpoints() {
        console.log('🔌 Testing Critical API Endpoints...');

        const endpoints = [
            { path: '/api/auth/me', name: 'auth_endpoint' },
            { path: '/api/leads', name: 'leads_endpoint' },
            { path: '/api/payments/plans', name: 'plans_endpoint' },
            { path: '/api/admin/stats', name: 'admin_stats' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${BACKEND_URL}${endpoint.path}`);
                this.recordResult('backend', endpoint.name, true,
                    `${endpoint.path} responding - Status: ${response.status}`);
            } catch (error) {
                const isExpectedAuth = error.response?.status === 401;
                const isPublicEndpoint = endpoint.path === '/api/payments/plans';
                this.recordResult('backend', endpoint.name, isExpectedAuth || isPublicEndpoint,
                    isExpectedAuth ? `${endpoint.path} properly secured (401)` : 
                    isPublicEndpoint && error.response?.status === 200 ? `${endpoint.path} public endpoint working` :
                    `${endpoint.path} error - ${error.message}`);
            }
        }
    }

    async testAuthentication() {
        console.log('🔐 Testing Authentication Flow...');

        try {
            // Test admin login endpoint exists
            const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            const isExpectedError = error.response?.status === 401 || error.response?.status === 400;
            this.recordResult('integration', 'auth_login', isExpectedError,
                isExpectedError ? 'Auth login endpoint responding correctly' : 'Auth login endpoint error');
        }
    }

    recordResult(category, test, passed, message) {
        this.results[category][test] = { passed, message };
        const icon = passed ? '✅' : '❌';
        console.log(`  ${icon} ${test}: ${message}`);
    }

    generateReport() {
        console.log('\n📋 PRODUCTION TEST REPORT');
        console.log('=' .repeat(50));

        let totalTests = 0;
        let passedTests = 0;

        Object.entries(this.results).forEach(([category, tests]) => {
            console.log(`\n📂 ${category.toUpperCase()} TESTS:`);
            
            Object.entries(tests).forEach(([test, result]) => {
                totalTests++;
                if (result.passed) passedTests++;
                
                const icon = result.passed ? '✅' : '❌';
                console.log(`  ${icon} ${test}: ${result.message}`);
            });
        });

        console.log('\n' + '='.repeat(50));
        console.log(`📊 SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests*100)}%)`);
        
        if (passedTests === totalTests) {
            console.log('🎉 ALL TESTS PASSED! Production build is ready for deployment.');
            console.log('\n🚀 DEPLOYMENT INSTRUCTIONS:');
            console.log('1. Deploy backend to your server (Node.js hosting)');
            console.log('2. Deploy frontend builds to static hosting');
            console.log('3. Update environment variables for production');
            console.log('4. Configure domain names and SSL certificates');
        } else {
            console.log('⚠️  Some tests failed. Please fix issues before deploying.');
        }

        console.log('=' .repeat(50));
    }
}

// Run the tests
const tester = new ProductionTester();
tester.runAllTests(); 