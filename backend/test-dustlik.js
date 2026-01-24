
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

        console.log("Searching for Do'stlik...");
        const res = await fetch("http://api.bts.uz:8080/index.php?r=directory/cities", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const cities = data?.data || [];

        const targets = cities.filter(c => {
            const s = JSON.stringify(c).toLowerCase();
            return s.includes("do'stlik") || s.includes("dustlik") || s.includes("дустлик");
        });

        console.log(`Found ${targets.length} matches:`);
        targets.forEach(c => {
            console.log(`[${c.id}] ${c.nameRu} (Region: ${c.regionId})`);
        });

        if (targets.length > 0) {
            const receiverId = targets[0].id;
            console.log(`\nCalculating Bukhara -> ${targets[0].nameRu} (5kg)...`);

            const calcRes = await fetch("http://api.bts.uz:8080/index.php?r=v1/order/calculate", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    senderCityId: 40,
                    senderPointId: 263,
                    receiverCityId: receiverId,
                    weight: 5,
                    senderDelivery: 0,
                    receiverDelivery: 0
                })
            });

            const calcData = await calcRes.json();
            const price = calcData.summaryPrice || calcData.data?.summaryPrice;
            console.log(`\nResult: ${price} UZS`);
        }

    } catch (e) {
        console.error(e);
    }
}

run();
