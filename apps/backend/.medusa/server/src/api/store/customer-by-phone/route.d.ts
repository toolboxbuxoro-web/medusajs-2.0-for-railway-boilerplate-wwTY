import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * Public route to resolve a phone number to an email.
 * Used by the storefront login flow to support legacy users who have real emails.
 */
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<MedusaResponse>;
