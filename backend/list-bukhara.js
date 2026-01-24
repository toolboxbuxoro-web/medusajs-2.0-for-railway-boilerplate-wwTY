
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

        console.log("Fetching branches...");
        const res = await fetch("http://api.bts.uz:8080/index.php?r=directory/branches", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            console.log("Branches failed:", res.status);
            return;
        }

        const data = await res.json();
        const allBranches = data?.data || [];

        // Filter for Bukhara (Region ID 7 or City ID 40/42)
        const bukharaPoints = allBranches.filter(b =>
            b.regionId === 7 ||
            b.cityId === 40 ||
            b.cityId === 42 ||
            (b.name && b.name.toLowerCase().includes('buxoro')) ||
            (b.name && b.name.toLowerCase().includes('bukhara'))
        );

        console.log(`Found ${bukharaPoints.length} points in Bukhara:`);
        bukharaPoints.forEach(p => {
            console.log(`[${p.id}] ${p.name} (Code: ${p.code})`);
            console.log(`   CityID: ${p.cityId}, Address: ${p.address}`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
