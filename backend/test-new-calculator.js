
const BTS_LOGIN = "0811112";
const BTS_PASSWORD = "C?b5LRZU%$";
const BTS_INN = "306329977";

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

        const token = (await authRes.json())?.data?.token;
        if (!token) return console.error("No token");

        // Codes found:
        // BUXORO: 8001
        // RAYMAG: 8018
        // Example receiver: 1001 (Tashkent?)
        const receiverCode = "1001"; // Assumption based on docs example and logic

        const testCases = [
            { name: "Sender: Raymag (8018)", sender: "8018" },
            { name: "Sender: Bukhara Main (8001)", sender: "8001" },
            { name: "Sender: City ID (40)", sender: "40" } // Just to check
        ];

        console.log(`\nTesting /v1/order-calculator (Receiver: ${receiverCode})...\n`);

        for (const test of testCases) {
            await calculate(token, test.name, test.sender, receiverCode);
        }

    } catch (e) {
        console.error(e);
    }
}

async function calculate(token, name, senderCode, receiverCode) {
    try {
        const body = {
            "senderCityCode": senderCode,
            "receiverCityCode": receiverCode,
            "pickup_type": "branch",
            "dropoff_type": "branch",
            "is_multiple_cost": 1,
            "weight": 2,
            "volume": { "x": 10, "y": 10, "z": 10 }
        };

        const res = await fetch("http://api.bts.uz:8080/index.php?r=v1/order-calculator", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log(`Response for ${name}:`, JSON.stringify(data, null, 2));

        if (data.status) {
            const prices = data.data;
            if (prices) {
                console.log(`✅ ${name}:`);
                console.log(`   Branch->Branch: ${prices.branch_to_branch?.price}`);
                console.log(`   Branch->Courier: ${prices.branch_to_courier?.price}`);
            } else {
                console.log(`❌ ${name}: prices/data is null`);
            }
        } else {
            console.log(`❌ ${name}: FAILED - ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`❌ ${name}: ERROR - ${e.message}`);
    }
}

run();
