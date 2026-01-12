"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBtsCost = exports.BTS_REGIONS = exports.BTS_PRICING = void 0;
exports.GET = GET;
exports.POST = POST;
// Official BTS pricing configuration (Tariff Card 2025)
exports.BTS_PRICING = {
    zoneRates: {
        1: 5000,
        2: 6000,
        3: 6500,
    },
    expressRates: {
        1: { 1: 25000, 2: 30000, 3: 35000 },
        2: { 1: 30000, 2: 35000, 3: 40000 },
        3: { 1: 35000, 2: 40000, 3: 45000 },
        5: { 1: 45000, 2: 55000, 3: 60000 },
        10: { 1: 65000, 2: 80000, 3: 90000 },
        15: { 1: 85000, 2: 100000, 3: 115000 },
        20: { 1: 100000, 2: 120000, 3: 135000 },
    },
    expressMaxWeight: 20,
    minWeight: 1,
    courierPickupFee: 30000,
    courierDeliveryFee: 30000,
    heavyWeightThreshold: 50,
    heavyWeightCoefficient: 1.3,
    winterMonths: [12, 1, 2, 3],
    winterFuelSurcharge: 0.30,
    insuranceRate: 0.005,
};
// All BTS regions with pickup points
exports.BTS_REGIONS = [
    {
        id: "tashkent-city",
        name: "Toshkent shahri",
        nameRu: "Ташкент",
        zone: 2,
        points: [
            { id: "yakkasaroy-1", name: "Yakkasaroy #1", address: "Yakkasaroy tumani" },
            { id: "yakkasaroy-2", name: "Yakkasaroy #2", address: "Yakkasaroy tumani" },
            { id: "yakkasaroy-3", name: "Yakkasaroy #3", address: "Yakkasaroy tumani" },
            { id: "uchtepa-1", name: "Uchtepa #1", address: "Uchtepa tumani" },
            { id: "uchtepa-2", name: "Uchtepa #2", address: "Uchtepa tumani" },
            { id: "chilonzor-1", name: "Chilonzor #1", address: "Chilonzor tumani" },
            { id: "chilonzor-2", name: "Chilonzor #2", address: "Chilonzor tumani" },
            { id: "chilonzor-3", name: "Chilonzor #3", address: "Chilonzor tumani" },
            { id: "yunusobod-1", name: "Yunusobod #1", address: "Yunusobod tumani" },
            { id: "yunusobod-2", name: "Yunusobod #2", address: "Yunusobod tumani" },
            { id: "sergeli-1", name: "Sergeli #1", address: "Sergeli tumani" },
            { id: "mirobod-1", name: "Mirobod #1", address: "Mirobod tumani" },
            { id: "olmazor-1", name: "Olmazor #1", address: "Olmazor tumani" },
            { id: "shayxontohur-1", name: "Shayxontohur #1", address: "Shayxontohur tumani" },
            { id: "ulugbek-1", name: "M.Ulug'bek #1", address: "M.Ulug'bek tumani" },
            { id: "yashnobod-1", name: "Yashnobod #1", address: "Yashnobod tumani" },
            { id: "yangihayot-1", name: "Yangihayot #1", address: "Yangihayot tumani" },
        ],
    },
    {
        id: "tashkent-region",
        name: "Toshkent viloyati",
        nameRu: "Ташкентская область",
        zone: 2,
        points: [
            { id: "chirchiq-1", name: "Chirchiq #1", address: "Chirchiq shahri" },
            { id: "chirchiq-2", name: "Chirchiq #2", address: "Chirchiq shahri" },
            { id: "olmaliq-1", name: "Olmaliq #1", address: "Olmaliq shahri" },
            { id: "angren-1", name: "Angren #1", address: "Angren shahri" },
            { id: "oqqorgon-1", name: "Oqqo'rg'on #1", address: "Oqqo'rg'on tuman" },
            { id: "yangiyol-1", name: "Yangiyo'l #1", address: "Yangiyo'l shahar" },
            { id: "bekobod-1", name: "Bekobod #1", address: "Bekobod shahri" },
            { id: "nurafshon-1", name: "Nurafshon #1", address: "Nurafshon shahri" },
            { id: "qibray-1", name: "Qibray #1", address: "Qibray tumani" },
            { id: "parkent-1", name: "Parkent #1", address: "Parkent tuman" },
            { id: "gazalkent-1", name: "G'azalkent #1", address: "G'azalkent shahri" },
        ],
    },
    {
        id: "samarkand",
        name: "Samarqand viloyati",
        nameRu: "Самаркандская область",
        zone: 1,
        points: [
            { id: "samarkand-city-1", name: "Samarqand #1", address: "Samarqand shahri" },
            { id: "kattaqorgon-1", name: "Kattaqo'rg'on #1", address: "Kattaqo'rg'on shahri" },
            { id: "urgut-1", name: "Urgut #1", address: "Urgut tumani" },
            { id: "jomboy-1", name: "Jomboy #1", address: "Jomboy tuman" },
            { id: "payariq-1", name: "Payariq #1", address: "Payariq tuman" },
            { id: "oqdaryo-1", name: "Oqdaryo #1", address: "Oqdaryo tumani" },
        ],
    },
    {
        id: "bukhara",
        name: "Buxoro viloyati",
        nameRu: "Бухарская область",
        zone: 1,
        points: [
            { id: "bukhara-city-1", name: "Buxoro #1", address: "Buxoro shahar" },
            { id: "kogon-1", name: "Kogon #1", address: "Kogon shahar" },
            { id: "vobkent-1", name: "Vobkent #1", address: "Vobkent tumani" },
            { id: "gijduvon-1", name: "G'ijduvon #1", address: "G'ijduvon tumani" },
            { id: "jondor-1", name: "Jondor #1", address: "Jondor tuman" },
        ],
    },
    {
        id: "fergana",
        name: "Farg'ona viloyati",
        nameRu: "Ферганская область",
        zone: 3,
        points: [
            { id: "fergana-city-1", name: "Farg'ona #1", address: "Farg'ona shahri" },
            { id: "qoqon-1", name: "Qo'qon #1", address: "Qo'qon shahar" },
            { id: "margilon-1", name: "Marg'ilon #1", address: "Marg'ilon shahar" },
            { id: "quvasoy-1", name: "Quvasoy #1", address: "Quvasoy shahar" },
            { id: "rishton-1", name: "Rishton #1", address: "Rishton tuman" },
            { id: "beshariq-1", name: "Beshariq #1", address: "Beshariq tuman" },
        ],
    },
    {
        id: "namangan",
        name: "Namangan viloyati",
        nameRu: "Наманганская область",
        zone: 3,
        points: [
            { id: "namangan-city-1", name: "Namangan #1", address: "Namangan shahar" },
            { id: "chust-1", name: "Chust #1", address: "Chust tumani" },
            { id: "uchqorgon-1", name: "Uchqo'rg'on #1", address: "Uchqo'rg'on tumani" },
            { id: "pop-1", name: "Pop #1", address: "Pop tumani" },
            { id: "chortoq-1", name: "Chortoq #1", address: "Chortoq tumani" },
        ],
    },
    {
        id: "andijan",
        name: "Andijon viloyati",
        nameRu: "Андижанская область",
        zone: 3,
        points: [
            { id: "andijan-city-1", name: "Andijon #1", address: "Andijon shahri" },
            { id: "asaka-1", name: "Asaka #1", address: "Asaka tuman" },
            { id: "shahrixon-1", name: "Shaxrixon #1", address: "Shaxrixon tuman" },
            { id: "xonobod-1", name: "Xonobod #1", address: "Xonobod shahar" },
        ],
    },
    {
        id: "kashkadarya",
        name: "Qashqadaryo viloyati",
        nameRu: "Кашкадарьинская область",
        zone: 1,
        points: [
            { id: "qarshi-1", name: "Qarshi #1", address: "Qarshi shaxar" },
            { id: "shahrisabz-1", name: "Shahrisabz #1", address: "Shahrisabz shahri" },
            { id: "kitob-1", name: "Kitob #1", address: "Kitob tuman" },
            { id: "guzor-1", name: "G'uzor #1", address: "G'uzor tumani" },
            { id: "muborak-1", name: "Muborak #1", address: "Muborak tumani" },
        ],
    },
    {
        id: "surkhandarya",
        name: "Surxondaryo viloyati",
        nameRu: "Сурхандарьинская область",
        zone: 2,
        points: [
            { id: "termiz-1", name: "Termiz #1", address: "Termiz shahri" },
            { id: "denov-1", name: "Denov #1", address: "Denov tuman" },
            { id: "boysun-1", name: "Boysun #1", address: "Boysun tumani" },
            { id: "sherobod-1", name: "Sherobod #1", address: "Sherobod tumani" },
        ],
    },
    {
        id: "navoi",
        name: "Navoiy viloyati",
        nameRu: "Навоийская область",
        zone: 1,
        points: [
            { id: "navoi-city-1", name: "Navoiy #1", address: "Navoiy shaxar" },
            { id: "zarafshon-1", name: "Zarafshon #1", address: "Zarafshon shahri" },
            { id: "nurota-1", name: "Nurota #1", address: "Nurota tumani" },
            { id: "karmana-1", name: "Karmana #1", address: "Karmana tuman" },
        ],
    },
    {
        id: "jizzakh",
        name: "Jizzax viloyati",
        nameRu: "Джизакская область",
        zone: 1,
        points: [
            { id: "jizzakh-city-1", name: "Jizzax #1", address: "Jizzax shaxar" },
            { id: "zomin-1", name: "Zomin #1", address: "Zomin tumani" },
            { id: "dustlik-1", name: "Do'stlik #1", address: "Do'stlik tumani" },
            { id: "paxtakor-1", name: "Paxtakor #1", address: "Paxtakor tumani" },
        ],
    },
    {
        id: "syrdarya",
        name: "Sirdaryo viloyati",
        nameRu: "Сырдарьинская область",
        zone: 2,
        points: [
            { id: "guliston-1", name: "Guliston #1", address: "Guliston shahri" },
            { id: "yangiyer-1", name: "Yangiyer #1", address: "Yangiyer tumani" },
            { id: "xovos-1", name: "Xovos #1", address: "Xovos tumani" },
            { id: "shirin-1", name: "Shirin #1", address: "Shirin tuman" },
        ],
    },
    {
        id: "khorezm",
        name: "Xorazm viloyati",
        nameRu: "Хорезмская область",
        zone: 2,
        points: [
            { id: "urganch-1", name: "Urganch #1", address: "Urganch shahar" },
            { id: "xiva-1", name: "Xiva #1", address: "Xiva shahar" },
            { id: "gurlan-1", name: "Gurlan #1", address: "Gurlan tumani" },
            { id: "xozorasp-1", name: "Xozorasp #1", address: "Xozorasp tumani" },
        ],
    },
    {
        id: "karakalpakstan",
        name: "Qoraqalpog'iston",
        nameRu: "Каракалпакстан",
        zone: 2,
        points: [
            { id: "nukus-1", name: "Nukus #1", address: "Nukus shahri" },
            { id: "qongirot-1", name: "Qo'ng'irot #1", address: "Qo'ng'irot tuman" },
            { id: "beruniy-1", name: "Beruniy #1", address: "Beruniy tumani" },
            { id: "tortko-1", name: "To'rtko'l #1", address: "To'rtko'l tuman" },
            { id: "xojayli-1", name: "Xo'jayli #1", address: "Xo'jayli tumani" },
        ],
    },
];
/**
 * Calculate BTS delivery cost (Office-to-Office from Bukhara)
 */
const calculateBtsCost = (weightKg, regionId) => {
    const region = exports.BTS_REGIONS.find((r) => r.id === regionId);
    if (!region)
        return 0;
    const roundedWeight = Math.ceil(Math.max(exports.BTS_PRICING.minWeight, weightKg));
    let cost;
    if (roundedWeight <= exports.BTS_PRICING.expressMaxWeight) {
        const tiers = Object.keys(exports.BTS_PRICING.expressRates).map(Number).sort((a, b) => a - b);
        const tier = tiers.find(t => t >= roundedWeight) || tiers[tiers.length - 1];
        cost = exports.BTS_PRICING.expressRates[tier][region.zone];
    }
    else {
        const ratePerKg = exports.BTS_PRICING.zoneRates[region.zone];
        cost = roundedWeight * ratePerKg;
        if (roundedWeight > exports.BTS_PRICING.heavyWeightThreshold) {
            cost *= exports.BTS_PRICING.heavyWeightCoefficient;
        }
    }
    const currentMonth = new Date().getMonth() + 1;
    if (exports.BTS_PRICING.winterMonths.includes(currentMonth)) {
        cost *= (1 + exports.BTS_PRICING.winterFuelSurcharge);
    }
    return Math.round(cost);
};
exports.calculateBtsCost = calculateBtsCost;
/**
 * GET /store/bts - Returns all BTS regions with pickup points and pricing config
 */
async function GET(req, res) {
    try {
        // Return regions in format suitable for frontend dropdown
        const regions = exports.BTS_REGIONS.map((r) => ({
            id: r.id,
            name: r.name,
            nameRu: r.nameRu,
            zone: r.zone,
            points: r.points.map((p) => ({
                id: p.id,
                name: p.name,
                address: p.address,
            })),
        }));
        return res.json({
            regions,
            pricing: exports.BTS_PRICING,
        });
    }
    catch (e) {
        const logger = req.scope.resolve("logger");
        logger?.error?.(`[store/bts] Error: ${e?.message || e}`);
        return res.status(500).json({ error: e?.message || "internal_error" });
    }
}
/**
 * POST /store/bts - Calculate delivery cost for given weight and region
 */
async function POST(req, res) {
    try {
        const { weight_kg, region_id } = (req.body || {});
        if (typeof weight_kg !== "number" || !region_id) {
            return res.status(400).json({ error: "weight_kg and region_id are required" });
        }
        const cost = (0, exports.calculateBtsCost)(weight_kg, region_id);
        const region = exports.BTS_REGIONS.find((r) => r.id === region_id);
        return res.json({
            cost,
            weight_kg,
            region_id,
            region_name: region?.nameRu,
            zone: region?.zone,
        });
    }
    catch (e) {
        const logger = req.scope.resolve("logger");
        logger?.error?.(`[store/bts] POST Error: ${e?.message || e}`);
        return res.status(500).json({ error: e?.message || "internal_error" });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2J0cy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUE4UkEsa0JBd0JDO0FBS0Qsb0JBdUJDO0FBNVRELHdEQUF3RDtBQUMzQyxRQUFBLFdBQVcsR0FBRztJQUN6QixTQUFTLEVBQUU7UUFDVCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7S0FDcUI7SUFFOUIsWUFBWSxFQUFFO1FBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7UUFDbkMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7UUFDbkMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7UUFDbkMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7UUFDbkMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUU7UUFDcEMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUU7UUFDdEMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUU7S0FDSztJQUU5QyxnQkFBZ0IsRUFBRSxFQUFFO0lBQ3BCLFNBQVMsRUFBRSxD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