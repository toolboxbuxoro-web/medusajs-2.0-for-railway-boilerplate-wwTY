/**
 * Test script to create a customer account locally
 * Run with: node test-create-account.js
 * 
 * This tests the same logic as quick-order route
 */

const fs = require('fs');
const path = require('path');

// Load env
function loadEnv() {
    const envPaths = ['backend/.env', 'backend/.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            console.log(`Loading env from ${p}`);
            const content = fs.readFileSync(p, 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^#=]+)=(.*)$/);
                if (match) {
                    process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
                }
            });
            break;
        }
    }
}

loadEnv();

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

// Test data
const TEST_PHONE = '998881234567';  // Change this for testing
const TEST_EMAIL = `${TEST_PHONE}@phone.local`;
const TEST_PASSWORD = Math.floor(100000 + Math.random() * 900000).toString();

console.log('=== Customer Account Creation Test ===');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Publishable Key: ${PUBLISHABLE_KEY ? 'SET' : 'MISSING'}`);
console.log(`Test Phone: +${TEST_PHONE}`);
console.log(`Test Email: ${TEST_EMAIL}`);
console.log(`Test Password: ${TEST_PASSWORD}`);
console.log('');

async function testCreateAccount() {
    const http = BACKEND_URL.startsWith('https') ? require('https') : require('http');

    // Step 1: Test auth register
    console.log('--- Step 1: Register Auth Identity ---');
    try {
        const registerResult = await fetch(`${BACKEND_URL}/auth/customer/emailpass/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });

        const registerData = await registerResult.json();
        console.log(`Status: ${registerResult.status}`);
        console.log(`Response: ${JSON.stringify(registerData, null, 2)}`);

        if (registerResult.ok) {
            console.log('✅ Auth registration successful!');
            console.log(`Token: ${registerData.token ? 'YES' : 'NO'}`);
        } else {
            console.log('❌ Auth registration failed');
            if (registerData.message?.includes('already exists')) {
                console.log('   (User might already exist - this is OK)');
            }
        }
    } catch (e) {
        console.error('Auth registration error:', e.message);
    }

    // Step 2: Test login with new credentials
    console.log('');
    console.log('--- Step 2: Login with Credentials ---');
    try {
        const loginResult = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            }),
        });

        const loginData = await loginResult.json();
        console.log(`Status: ${loginResult.status}`);
        console.log(`Response: ${JSON.stringify(loginData, null, 2)}`);

        if (loginResult.ok && loginData.token) {
            console.log('✅ Login successful!');
            console.log('   This means auth identity was created correctly.');

            // Step 3: Get customer profile
            console.log('');
            console.log('--- Step 3: Get Customer Profile ---');
            const meResult = await fetch(`${BACKEND_URL}/store/customers/me`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`,
                    'x-publishable-api-key': PUBLISHABLE_KEY,
                },
            });

            const meData = await meResult.json();
            console.log(`Status: ${meResult.status}`);
            console.log(`Response: ${JSON.stringify(meData, null, 2)}`);

            if (meResult.ok && meData.customer) {
                console.log('✅ Customer profile found!');
                console.log(`   ID: ${meData.customer.id}`);
                console.log(`   Email: ${meData.customer.email}`);
                console.log(`   has_account: ${meData.customer.has_account}`);
            } else {
                console.log('❌ Customer profile NOT found - auth and customer are NOT linked!');
                console.log('   This is the bug! Auth exists but customer does not exist or not linked.');
            }
        } else {
            console.log('❌ Login failed - auth identity might not exist or wrong credentials');
        }
    } catch (e) {
        console.error('Login error:', e.message);
    }

    // Step 4: List customers by email
    console.log('');
    console.log('--- Step 4: Check if Customer Exists in Admin ---');
    try {
        // This requires admin auth, so we use a workaround - check via store API
        const searchResult = await fetch(`${BACKEND_URL}/store/customers?email=${encodeURIComponent(TEST_EMAIL)}`, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY,
            },
        });

        console.log(`Status: ${searchResult.status}`);
        if (searchResult.status === 401) {
            console.log('   (Requires auth - cannot check directly)');
        } else {
            const searchData = await searchResult.json();
            console.log(`Response: ${JSON.stringify(searchData, null, 2)}`);
        }
    } catch (e) {
        console.log(`   Error: ${e.message}`);
    }

    console.log('');
    console.log('=== Test Complete ===');
    console.log(`Try logging in on the site with:`);
    console.log(`   Phone: +${TEST_PHONE}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
}

testCreateAccount().catch(console.error);
