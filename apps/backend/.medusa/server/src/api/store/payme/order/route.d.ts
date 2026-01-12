import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * Lookup Medusa order id for a Payme-paid cart.
 *
 * Storefront Payme return_url uses order_id param (stored as data->>'order_id' in payment_session).
 * This endpoint looks up the payment session and returns the medusa_order_id after completion.
 */
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<MedusaResponse>;
