import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * BTS shipping option can be configured without a price in Medusa admin.
 * Medusa then refuses to attach it to cart: "Shipping options ... do not have a price".
 *
 * This endpoint force-attaches a shipping method row to the cart with a concrete amount
 * (taken from storefront-calculated BTS estimate), bypassing shipping option price validation.
 *
 * Uses direct SQL INSERT to bypass Medusa's validation, then triggers cart recalculation
 * via Cart Module to ensure totals are updated correctly.
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<MedusaResponse>;
