import { Logger } from "@medusajs/framework/types";
export declare enum ClickErrorCodes {
    SUCCESS = 0,
    SIGN_CHECK_FAILED = -1,
    INCORRECT_AMOUNT = -2,
    ACTION_NOT_FOUND = -3,
    ALREADY_PAID = -4,
    USER_DOES_NOT_EXIST = -5,
    TRANSACTION_DOES_NOT_EXIST = -6,
    FAILED_TO_UPDATE_USER = -7,
    ERROR_IN_REQUEST_FROM_CLICK = -8,
    TRANSACTION_CANCELLED = -9
}
type InjectedDependencies = {
    logger: Logger;
    container: any;
};
type ClickPrepareRequest = {
    click_trans_id: string;
    service_id: string;
    click_paydoc_id: string;
    merchant_trans_id: string;
    amount: string;
    action: string;
    error: string;
    error_note: string;
    sign_time: string;
    sign_string: string;
};
type ClickCompleteRequest = ClickPrepareRequest & {
    merchant_prepare_id: string;
};
export declare class ClickMerchantService {
    protected logger_: Logger;
    protected container_: any;
    constructor({ logger, container }: InjectedDependencies);
    private getSecretKey;
    private getServiceId;
    private getUserId;
    /**
     * Generate Auth header for Click Fiscalization API
     * Format: {user_id}:{sha1(timestamp + secret_key)}:{timestamp}
     */
    private generateAuthHeader;
    /**
     * Fetch cart items for fiscalization
     * Returns items with MXIK codes, prices, quantities for Click OFD API
     */
    private getCartItemsForFiscalization;
    private hasColumn;
    /**
     * Submit fiscalization data to Click OFD API
     * Called after successful payment completion
     */
    private submitFiscalizationData;
    /**
     * Find Click payment session by merchant_trans_id (we use cart_id).
     * Uses raw SQL to query by JSON field since remoteQuery filters can be unreliable.
     */
    private getPaymentSessionByMerchantTransId;
    private parseSessionData;
    private buildPrepareResponse;
    private buildCompleteResponse;
    private validateAmountMatchesSession;
    handlePrepare(body: Partial<ClickPrepareRequest>): Promise<{
        click_trans_id: string;
        merchant_trans_id: string;
        merchant_prepare_id: string;
        error: number;
        error_note: string;
    }>;
    handleComplete(body: Partial<ClickCompleteRequest>): Promise<{
        click_trans_id: string;
        merchant_trans_id: string;
        merchant_confirm_id: string;
        error: number;
        error_note: string;
    }>;
}
export {};
