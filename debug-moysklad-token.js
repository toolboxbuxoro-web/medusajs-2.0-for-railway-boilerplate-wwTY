// Native fetch is available in Node 18+

const token = process.argv[2] || 'd315552c7dcf1ab7280f02f24e3b2822b0fc3bc4';

async function checkToken() {
    console.log(`Checking token: ${token.substring(0, 5)}...`);

    // Format header
    const isAccessToken = /^[a-f0-9]+$/i.test(token);
    const authScheme = isAccessToken ? 'Bearer' : 'Basic';
    const headers = {
        "Authorization": `${authScheme} ${token}`,
        "Accept": "application/json;charset=utf-8",
        "Content-Type": "application/json"
    };

    console.log(`Using Header: Authorization: ${authScheme} ***`);

    try {
        const url = "https://api.moysklad.ru/api/remap/1.2/entity/employee"; // Try a simple endpoint first
        console.log(`Fetching ${url}...`);

        const response = await fetch(url, { headers });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        console.log("Response Body:", text);

        if (response.ok) {
            console.log("✅ Token matches an employee!");
        } else {
            console.log("❌ Token failed.");
        }

    } catch (error) {
        console.error("Error executing request:", error);
    }
}

checkToken();
