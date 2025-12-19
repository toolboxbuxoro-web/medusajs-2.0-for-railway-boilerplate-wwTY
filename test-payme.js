const fetch = require('node-fetch');

// CONFIG
const ENDPOINT = "https://www.toolbox-tools.uz/api/payment/payme";
const AUTH_HEADER = "Basic " + Buffer.from("Paycom:Nemat2005!").toString('base64'); // Replace with actual credentials if different

// MOCK PAYLOAD
// This simulates what Payme sends when checking if a transaction is allowed
const payload = {
    "method": "CheckPerformTransaction",
    "params": {
        "amount": 10000, // 100 UZS in tiyin
        "account": {
            "order_id": "test_order_id" // Needs to be a valid cart ID from your DB
        }
    },
    "id": 123
};

async function testPayme() {
    console.log("Sending request to:", ENDPOINT);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': AUTH_HEADER // Uncomment if basic auth is handled at ingress level, usually Payme handles it via params or headers
            },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        console.log("Response Status:", response.status);
        console.log("Response Body:", text);
    } catch (error) {
        console.error("Error:", error);
    }
}

testPayme();
