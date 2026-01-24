
const BTS_LOGIN = "0811112";
const BTS_PASSWORD = "C?b5LRZU%$";
const BTS_INN = "306329977";

async function run() {
    try {
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
        const res = await fetch("http://api.bts.uz:8080/index.php?r=directory/regions", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Regions Map:");
        data.data.forEach(r => {
            console.log(`ID: ${r.id} -> ${r.nameEn} / ${r.nameRu}`);
        });

    } catch (e) {
        console.error(e);
    }
}

run();
