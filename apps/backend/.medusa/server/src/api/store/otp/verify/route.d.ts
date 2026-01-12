import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
/**
 * POST /store/otp/verify
 * Verify OTP code for phone number and purpose
 */
export declare function POST(req: MedusaRequest, res: MedusaResponse): Promise<MedusaResponse>;
