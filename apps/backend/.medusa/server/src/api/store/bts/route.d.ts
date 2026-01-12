import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * BTS Express Uzbekistan - Official Tariff Card 2025
 * Source: bts.uz/documenty/ru/xizmatlarining-tarif-karta/2025-01-10
 */
export interface BtsPoint {
    id: string;
    name: string;
    address: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}
export interface BtsRegion {
    id: string;
    name: string;
    nameRu: string;
    zone: 1 | 2 | 3;
    points: BtsPoint[];
}
export declare const BTS_PRICING: {
    zoneRates: Record<1 | 2 | 3, number>;
    expressRates: Record<number, Record<1 | 2 | 3, number>>;
    expressMaxWeight: number;
    minWeight: number;
    courierPickupFee: number;
    courierDeliveryFee: number;
    heavyWeightThreshold: number;
    heavyWeightCoefficient: number;
    winterMonths: number[];
    winterFuelSurcharge: number;
    insuranceRate: number;
};
export declare const BTS_REGIONS: BtsRegion[];
/**
 * Calculate BTS delivery cost (Office-to-Office from Bukhara)
 */
export declare const calculateBtsCost: (weightKg: number, regionId: string) => number;
/**
 * GET /store/bts - Returns all BTS regions with pickup points and pricing config
 */
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<MedusaResponse>;
/**
 * POST /store/bts - Calculate delivery cost for given weight and region
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<MedusaResponse>;
