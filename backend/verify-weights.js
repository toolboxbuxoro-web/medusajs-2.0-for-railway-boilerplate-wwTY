
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

        const weights = [5, 10, 15, 30, 50];
        const senderCityId = 40; // Bukhara
        const receiverCityId = 101; // Tashkent

        console.log(`\nPrice Check: Bukhara -> Tashkent (Office-to-Office)\n`);
        console.log(`| Weight (kg) | API Price (UZS) |`);
        console.log(`|-------------|-----------------|`);

        for (const w of weights) {
            await calculate(token, w, senderCityId, receiverCityId);
        }

    } catch (e) {
        console.error(e);
    }
}

async function calculate(token, weight, senderId, receiverId) {
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
                senderDelivery: 0, // Office drop-off
                receiverDelivery: 0 // Office pick-up
            })
        });

        const data = await res.json();
        const price = data.summaryPrice || data.data?.summaryPrice || "ERROR";

        console.log(`| ${weight.toString().padEnd(11)} | ${price.toString().padEnd(15)} |`);

    } catch (e) {
        console.log(`| ${weight} | Error: ${e.message} |`);
    }
}

run();
