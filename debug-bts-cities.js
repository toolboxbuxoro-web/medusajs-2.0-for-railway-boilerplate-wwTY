// Native fetch is available in Node 18+
const fs = require('fs');
const path = require('path');

// Try to read .env
let login, pass, inn;
try {
    const envPath = path.resolve(process.cwd(), 'backend/.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const vars = envContent.split('\n').reduce((acc, line) => {
        const [key, val] = line.split('=');
        if (key && val) acc[key.trim()] = val.trim();
        return acc;
    }, {});

    login = process.env.BTS_LOGIN || vars.BTS_LOGIN;
    pass = process.env.BTS_PASSWORD || vars.BTS_PASSWORD;
    inn = process.env.BTS_INN || vars.BTS_INN;
} catch (e) {
    login = process.env.BTS_LOGIN;
    pass = process.env.BTS_PASSWORD;
    inn = process.env.BTS_INN;
}

if (!login || !pass || !inn) {
    console.error("Missing credentials. Please set BTS_LOGIN, BTS_PASSWORD, BTS_INN env vars or in .env file");
    process.exit(1);
}

const baseUrl = "http://api.bts.uz:8080/index.php";

async function getToken() {
    console.log("Authenticating...");
    const resp = await fetch(`${baseUrl}?r=v1/auth/get-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: login, password: pass, inn: inn }),
    });

    if (!resp.ok) {
        throw new Error(`Auth failed: ${resp.status} ${await resp.text()}`);
    }

    const json = await resp.json();
    return json.data.token;
}

async function testEndpoint(name, path, token) {
    console.log(`\nTesting ${name}: ${path}`);
    const url = `${baseUrl}?r=${path}`;
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        console.log(`Status: ${resp.status} ${resp.statusText}`);
        if (resp.ok) {
            const json = await resp.json();
            console.log(`Success! Found ${json.data?.length} items`);
            console.log('Sample:', JSON.stringify(json.data?.[0]));
        } else {
            console.log('Error:', await resp.text());
        }
    } catch (e) {
        console.log('Exception:', e.message);
    }
}

async function run() {
    try {
        const token = await getToken();
        console.log("Token obtained.");

        await testEndpoint("V1 Cities", "v1/directory/cities", token);
        await testEndpoint("No-V1 Cities", "directory/cities", token);
        await testEndpoint("City List", "v1/city/list", token);
        await testEndpoint("Directory List", "v1/directory/list", token);

    } catch (e) {
        console.error("Fatal:", e.message);
    }
}

run();
