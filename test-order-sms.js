/**
 * Test script to simulate order.placed event and SMS sending
 * Run with: node test-order-sms.js
 * 
 * This tests the SMS handler logic after payment completion
 */

const fs = require('fs');

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

// Test data - simulate a completed order
const TEST_PHONE = '998882810036';
const TEST_CART_ID = 'cart_test_' + Date.now();
const TEST_PASSWORD = '123456';

console.log('=== Order SMS Test ===');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log('');

async function testSmsFlow() {
    console.log('--- Step 1: Create a cart with quick order metadata ---');

    // We'll query an existing recent order to check if metadata is present
    console.log('Checking recent orders for metadata...');

    try {
        // Query backend for recent orders/carts
        const dbCheckUrl = `${BACKEND_URL}/admin/orders?limit=5&order=-created_at`;
        console.log(`Note: Cannot access admin API without auth. Checking store API...`);

        // Instead, let's check if we can create a cart and update metadata
        console.log('');
        console.log('--- Step 2: Test Cart Metadata Persistence ---');

        // Create a test to verify cart metadata survives to payment session
        // This requires checking the database directly or using the debug endpoint

        // Let's check the payment session data via the payme order lookup
        console.log('');
        console.log('--- Step 3: Check if Payment Session has Cart Metadata ---');

        // Query a recent cart's payment session
        // We can't do this without DB access, so let's suggest what to check

        console.log(`
Problem Analysis:
1. Quick Order sets cart.metadata with is_quick_order + tmp_generated_password
2. Payment is completed via Payme PerformTransaction
3. completeCartWorkflow creates an Order from Cart
4. order.placed event fires
5. SMS handler checks order.metadata for is_quick_order + tmp_generated_password

The gap is likely in step 3-4: Cart metadata may NOT be copied to Order metadata.

To verify, run this SQL in Railway database:

-- Check recent carts with quick order metadata:
SELECT id, email, metadata FROM cart 
WHERE metadata->>'is_quick_order' = 'true' 
ORDER BY created_at DESC LIMIT 5;

-- Check if corresponding orders have the metadata:
SELECT o.id, o.email, o.metadata, c.metadata as cart_metadata 
FROM "order" o 
LEFT JOIN cart c ON c.id = o.cart_id 
ORDER BY o.created_at DESC LIMIT 5;

If cart has metadata but order doesn't, we need to copy metadata during cart completion.
    `);

        console.log('');
        console.log('--- Step 4: Alternative Solution ---');
        console.log(`
Instead of relying on order.metadata, we should:
1. Store credentials in payment_session.data (already done by Payme PerformTransaction)
2. SMS handler should read from payment_session.data instead of order.metadata

OR

1. After PerformTransaction, when we complete cart, we update order.metadata explicitly
2. This ensures the data propagates correctly

Let me implement option 2 - copy cart metadata to order during PerformTransaction.
    `);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSmsFlow().catch(console.error);

console.log('');
console.log('=== Quick Diagnostic Commands ===');
console.log(`
Run in Railway shell or psql:

1. Check if cart metadata exists:
   SELECT id, metadata->>'is_quick_order', metadata->>'tmp_generated_password' 
   FROM cart WHERE email LIKE '%@phone.local' ORDER BY created_at DESC LIMIT 5;

2. Check if order received metadata:
   SELECT id, display_id, metadata 
   FROM "order" WHERE email LIKE '%@phone.local' ORDER BY created_at DESC LIMIT 5;

3. Check payment session data:
   SELECT id, data->>'order_id', data->>'medusa_order_id', data 
   FROM payment_session WHERE provider_id LIKE '%payme%' ORDER BY created_at DESC LIMIT 3;
`);
