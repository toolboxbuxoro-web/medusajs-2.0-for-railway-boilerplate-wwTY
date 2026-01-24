
const BTS_LOGIN = "0811112";
const BTS_PASSWORD = "C?b5LRZU%$";
const BTS_INN = "306329977";

const ENDPOINTS = [
    // Found working:
    "directory/cities",
    "directory/regions",

    // Testing points without v1
    "directory/points",
    "directory/point",
    "directory/places",
    "directory/branches",
    "directory/offices",

    // Maybe under region?
    "directory/list",
];

// Helper to clean response
const clean = (json) => JSON.stringify(json, null, 2);

async function run() {
    try {
        console.log("Getting token...");
        const authRes = await fetch("http://api.bts.uz:8080/index.php?r=v1/auth/get-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: BTS_LOGIN,
                password: BTS_PASSWORD,
                inn: BTS_INN
            })
        });

        const authData = await authRes.json();
        const token = authData?.data?.token;

        if (!token) {
            console.error("No token obtained:", authData);
            return;
        }
        console.log("Token obtained.");

        for (const endpoint of ENDPOINTS) {
            console.log(`\nTesting endpoint: ${endpoint}...`);
            try {
                const res = await fetch(`http://api.bts.uz:8080/index.php?r=${endpoint}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    const list = data?.data || [];
                    console.log(`✅ SUCCESS [${endpoint}]: Found ${Array.isArray(list) ? list.length : 'Object'} items`);

                    if (Array.isArray(list) && list.length > 0) {
                        // Clean logging to avoid huge output, but show search results
                        const cleanList = list.map(i => ({ id: i.id, name: i.name, region_id: i.region_id }));
                        // console.log("First 3:", JSON.stringify(cleanList.slice(0, 3), null, 2));

                        const matches = list.filter(item => {
                            const str = JSON.stringify(item).toLowerCase();
                            return str.includes('buxor') || str.includes('бухар') || str.includes('raymag') || str.includes('раймаг');
                        });

                        if (matches.length > 0) {
                            console.log("🎯 MATCHES FOUND:", JSON.stringify(matches, null, 2));
                        } else {
                            console.log("No matches for Bukhara/Raymag found in this list.");
                        }
                    } else if (!Array.isArray(list)) {
                        console.log("Response:", JSON.stringify(data, null, 2));
                    }
                } else {
                    console.log(`❌ FAILED [${endpoint}]: ${res.status} ${res.statusText}`);
                }
            } catch (err) {
                console.log(`❌ ERROR [${endpoint}]:`, err.message);
            }
        }

    } catch (e) {
        console.error("Critical error:", e);
    }
}

run();
