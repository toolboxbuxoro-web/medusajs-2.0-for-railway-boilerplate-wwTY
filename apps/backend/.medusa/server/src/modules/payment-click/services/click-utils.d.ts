/**
 * Click signature formulas (docs.click.uz /click-api-request):
 * - Prepare: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
 * - Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
 */
export declare function md5Hex(input: string): string;
export declare function normalizeString(value: unknown): string;
export declare function verifyClickPrepareSignature(params: {
    click_trans_id: string;
    service_id: string;
    secret_key: string;
    merchant_trans_id: string;
    amount: string;
    action: string;
    sign_time: string;
    sign_string: string;
}): boolean;
export declare function verifyClickCompleteSignature(params: {
    click_trans_id: string;
    service_id: string;
    secret_key: string;
    merchant_trans_id: string;
    merchant_prepare_id: string;
    amount: string;
    action: string;
    sign_time: string;
    sign_string: string;
}): boolean;
/**
 * Convert Click amount string in sums (format N or N.NN) into minor units (tiyin) as bigint.
 * This is used only for internal validation; signature verification must use the original string.
 */
export declare function parseUzsAmountToTiyin(amount: string): bigint | null;
export declare function formatTiyinToUzsAmount(amountTiyin: number): string;
