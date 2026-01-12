import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { Logger, ProviderWebhookPayload, WebhookActionResult } from "@medusajs/framework/types";
type Options = {
    payme_id: string;
    payme_key: string;
    payme_url?: string;
};
type InjectedDependencies = {
    logger: Logger;
};
/**
 * Payme Payment Provider Service for Medusa 2.0.
 * Handles payment URL generation and session lifecycle.
 */
export declare class PaymePaymentProviderService extends AbstractPaymentProvider<Options> {
    static identifier: string;
    protected logger_: Logger;
    protected options_: Options;
    protected paymeUrl_: string;
    constructor(container: InjectedDependencies, options: Options);
    private formatPaymeUrl;
    /**
     * Generate Payme payment URL.
     * @param orderId - Cart ID used as order identifier.
     * @param amount - Amount in tiyin (Medusa 2.0 stores amounts in minor units).
     * @param currencyCode - Currency code (default UZS).
     */
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
    getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult>;
}
export {};
