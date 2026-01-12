import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { Logger, ProviderWebhookPayload, WebhookActionResult } from "@medusajs/framework/types";
type Options = {
    merchant_id: string;
    service_id: string;
    secret_key: string;
    pay_url?: string;
    merchant_user_id?: string;
    card_type?: "uzcard" | "humo";
};
type InjectedDependencies = {
    logger: Logger;
};
export interface ClickSessionData {
    merchant_trans_id: string;
    amount_tiyin: number;
    amount: string;
    currency: string;
    payment_url?: string;
    click_state?: "pending" | "prepared" | "completed" | "cancelled" | "error";
    click_trans_id?: string;
    click_paydoc_id?: string;
    merchant_prepare_id?: string;
    click_error?: number;
    click_error_note?: string;
    sign_time?: string;
    mode?: "redirect" | "pay_by_card";
    public_config?: {
        merchant_id: string;
        service_id: string;
        merchant_user_id?: string;
        card_type?: "uzcard" | "humo";
    };
}
/**
 * Click redirect payment provider (my.click.uz/services/pay).
 */
export declare class ClickPaymentProviderService extends AbstractPaymentProvider<Options> {
    static identifier: string;
    protected logger_: Logger;
    protected options_: Options;
    protected payUrl_: string;
    constructor(container: InjectedDependencies, options: Options);
    private getStoreReturnUrl;
    private generatePaymentUrl;
    initiatePayment(input: any): Promise<any>;
    authorizePayment(input: any): Promise<any>;
    cancelPayment(input: any): Promise<any>;
    capturePayment(input: any): Promise<any>;
    deletePayment(input: any): Promise<any>;
    getPaymentStatus(input: any): Promise<any>;
    refundPayment(input: any): Promise<any>;
    retrievePayment(input: any): Promise<any>;
    updatePayment(input: any): Promise<any>;
    getWebhookActionAndData(_data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult>;
}
/**
 * Click Pay-by-card provider (checkout.js widget).
 * We still rely on the same Click Prepare/Complete callbacks on the backend.
 */
export declare class ClickPayByCardProviderService extends ClickPaymentProviderService {
    static identifier: string;
    initiatePayment(input: any): Promise<any>;
}
export {};
