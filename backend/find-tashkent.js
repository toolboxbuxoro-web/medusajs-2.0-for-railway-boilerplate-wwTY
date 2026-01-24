
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

        // Check ID 101
        const city101 = cities.find(c => c.id == 101);
        if (city101) {
            console.log("✅ Found ID 101:", JSON.stringify(city101, null, 2));
        } else {
            console.log("❌ ID 101 NOT FOUND in list.");
        }

        // Search for synonyms
        const keywords = ['tosh', 'tash', 'yakka', 'qush', 'serg', 'chil'];
        const matches = cities.filter(c => {
            const s = JSON.stringify(c).toLowerCase();
            return keywords.some(k => s.includes(k));
        });

        console.log(`\nFound ${matches.length} matches for keywords [${keywords.join(', ')}]:`);
        matches.forEach(c => {
            console.log(`[${c.id}] ${c.name} / ${c.nameRu} (Region: ${c.regionId})`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
