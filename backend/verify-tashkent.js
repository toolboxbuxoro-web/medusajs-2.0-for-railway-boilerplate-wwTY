
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

        // User saw 89,000 for 10kg
        const weight = 10;
        const senderId = 40; // Bukhara City

        const targets = [
            { name: "Yakkasaroy (200) [Tashkent City]", id: 200 },
            { name: "Chilonzor (197) [Tashkent City]", id: 197 },
            { name: "Sergeli (193) [Tashkent City]", id: 193 },
            { name: "Tashkent District (4) [Tashkent Reg]", id: 4 },
            { name: "Samarkand (101) [OLD INCORRECT]", id: 101 }
        ];

        console.log(`\nPrice Check: Bukhara (40) -> Targets (10kg)\n`);

        for (const t of targets) {
            await calculate(token, t.name, senderId, t.id, weight);
        }

    } catch (e) {
        console.error(e);
    }
}

async function calculate(token, name, senderId, receiverId, weight) {
    try {
        const res = await fetch("http://api.bts.uz:8080/index.php?r=v1/order/calculate", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                senderCityId: senderId,
                receiverCityId: receiverId,
                weight: weight,
                senderDelivery: 0,
                receiverDelivery: 0
            })
        });

        const data = await res.json();
        const price = data.summaryPrice || data.data?.summaryPrice || "ERROR";

        console.log(`To ${name.padEnd(35)}: ${price} UZS`);

    } catch (e) {
        console.log(`To ${name}: Error - ${e.message}`);
    }
}

run();
