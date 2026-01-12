/**
 * ⚠️ Mobile-only endpoint
 * This route MUST NOT be used by the web storefront.
 * Any breaking change here is acceptable ONLY for mobile.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
export declare function GET(req: MedusaRequest, res: MedusaResponse): Promise<void>;
