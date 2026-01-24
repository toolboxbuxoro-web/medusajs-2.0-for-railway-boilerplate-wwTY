
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

        const testCases = [
            // Standard: Bukhara City (ID 40)
            { name: "1. Bukhara (City 40) - Office Drop-off (senderDelivery=0)", params: { senderCityId: 40, senderDelivery: 0 } },

            // Courier Pickup
            { name: "2. Bukhara (City 40) - Courier Pickup (senderDelivery=1)", params: { senderCityId: 40, senderDelivery: 1 } },

            // Testing Point ID in various fields
            { name: "3. Point ID 263 as senderCityId", params: { senderCityId: 263, senderDelivery: 0 } },
            { name: "4. Point ID 263 as senderPointId", params: { senderCityId: 40, senderPointId: 263, senderDelivery: 0 } },
            { name: "5. Point ID 263 as senderBranchId", params: { senderCityId: 40, senderBranchId: 263, senderDelivery: 0 } },
            { name: "6. Point ID 263 as pointId", params: { senderCityId: 40, pointId: 263, senderDelivery: 0 } }
        ];

        const receiverId = 101; // Tashkent
        const weight = 2; // kg

        console.log(`\nCalculating cost for 2kg to Tashkent (ID 101)...\n`);

        for (const test of testCases) {
            await calculate(token, test.name, test.params, receiverId, weight);
        }

    } catch (e) {
        console.error(e);
    }
}

async function calculate(token, name, params, receiverId, weight) {
    try {
        const body = {
            receiverCityId: receiverId,
            weight: weight,
            receiverDelivery: 0, // Office pick-up default
            ...params
        };

        const res = await fetch("http://api.bts.uz:8080/index.php?r=v1/order/calculate", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        // API returns object with summaryPrice directly or without success wrapper sometimes?
        // Response saw: {"summaryPrice":36000,"requestData":...}

        if (data && typeof data.summaryPrice === 'number') {
            console.log(`✅ ${name}: ${data.summaryPrice} UZS`);
            if (receiverId !== 101) console.log(`   (To Bukhara ID 40 instead of Tashkent)`);
        } else if (data.success && data.data) {
            console.log(`✅ ${name}: ${data.data.summaryPrice} UZS`);
        } else {
            console.log(`❌ ${name}: FAILED - ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`❌ ${name}: ERROR - ${e.message}`);
    }
}

run();
