
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Helper to load env
function loadEnv() {
    const envPaths = ['.env', '.env.local', 'storefront/.env', 'storefront/.env.local'];
    const env = {};
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            console.log(`Loading env from ${p}`);
            const content = fs.readFileSync(p, 'utf8');
            content.split('\n').forEach(line => {
                const [k, v] = line.split('=');
                if (k && v) env[k.trim()] = v.trim().replace(/^["']|["']$/g, ''); // simple parse
            });
        }
    }
    return env;
}

const env = loadEnv();
const BACKEND_URL = env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

const CART_ID = '90d69398-5519-41f0-ac31-06ce1327fa90'; // From user report

console.log('--- Payme Order Lookup Debug ---');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Publishable Key Present: ${!!PUBLISHABLE_KEY}`);
console.log(`Target Cart ID: ${CART_ID}`);

async function checkOrder(withKey) {
    const url = `${BACKEND_URL}/store/payme/order?cart_id=${CART_ID}`;
    const headers = {};
    if (withKey) {
        headers['x-publishable-api-key'] = PUBLISHABLE_KEY;
    }

    console.log(`\nFetching ${url} [With Key: ${withKey}]...`);

    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.request(url, { headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Body: ${data}`);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Error: ${e.message}`);
            resolve();
        });

        req.end();
    });
}

async function run() {
    await checkOrder(false); // Without Key
    await checkOrder(true);  // With Key
}

run();
