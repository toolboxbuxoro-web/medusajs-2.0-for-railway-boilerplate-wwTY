
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

        console.log("Fetching cities...");
        const res = await fetch("http://api.bts.uz:8080/index.php?r=directory/cities", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const cities = data?.data || [];
        console.log(`Total cities found: ${cities.length}`);
        if (cities.length > 0) {
            console.log("First city sample:", JSON.stringify(cities[0], null, 2));
        }

        const tashkent = cities.filter(c => {
            const str = JSON.stringify(c).toLowerCase();
            return str.includes('toshkent') || str.includes('ташкент');
        });
        console.log(`Found ${tashkent.length} Tashkent entries:`);
        tashkent.forEach(c => {
            console.log(`[${c.id}] ${c.name || c.nameRu} (Region: ${c.regionId})`);
        });

        const bukhara = cities.filter(c => {
            const str = JSON.stringify(c).toLowerCase();
            return str.includes('buxoro') || str.includes('бухара');
        });
        console.log(`Found ${bukhara.length} Bukhara entries:`);
        bukhara.forEach(c => {
            console.log(`[${c.id}] ${c.name} (Region: ${c.regionId})`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
