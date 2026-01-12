import { Logger } from "@medusajs/framework/types";
type InjectedDependencies = {
    logger: Logger;
    container: any;
};
export declare enum PaymeErrorCodes {
    INTERNAL_ERROR = -32400,
    INSUFFICIENT_PRIVILEGE = -32504,
    INVALID_JSON_RPC_OBJECT = -32600,
    METHOD_NOT_FOUND = -32601,
    INVALID_AMOUNT = -31001,
    TRANSACTION_NOT_FOUND = -31003,
    INVALID_ACCOUNT = -31050,
    COULD_NOT_CANCEL = -31007,
    COULD_NOT_PERFORM = -31008,
    ORDER_ALREADY_PAID = -31099
}
/**
 * Custom error class for Payme JSON-RPC errors.
 */
export declare class PaymeError extends Error {
    code: number;
    data: any;
    constructor(code: number, message: string, data?: any);
}
/**
 * Service for handling Payme Merchant API JSON-RPC requests.
 * Follows the standard Payme protocol for transaction lifecycle.
 */
export declare class PaymeMerchantService {
    protected logger_: Logger;
    protected container_: any;
    constructor({ logger, container }: InjectedDependencies);
    private hasColumn;
    /**
     * Route incoming JSON-RPC method calls to the appropriate handler.
     */
    handleRequest(method: string, params: any): Promise<{
        allow: boolean;
        account: any;
        detail: {
            receipt_type: number;
            shipping: {
                title: string;
                price: number;
                address: string;
            };
            customer: {
                name: string;
                phone: string;
                address: string;
            };
            items: any[];
        };
    } | {
        create_time: any;
        transaction: any;
        state: any;
        account: any;
    } | {
        transaction: any;
        perform_time: any;
        state: number;
    } | {
        transaction: any;
        cancel_time: any;
        state: any;
    } | {
        transactions: any;
    }>;
    /**
     * Find Payme payment session by order_id stored in session data.
     * Uses raw SQL to query by JSON field since remoteQuery filters don't work reliably.
     * @param orderId - The order_id (cart_id) passed from Payme.
     */
    private getPaymentSessionByOrderId;
    /**
     * Find payment session by Medusa Session ID.
     * @param id - Medusa Session ID (returned from CreateTransaction).
     */
    private findSession;
    /**
     * Find payment session by Payme transaction ID stored in session.data.
     * @param paymeTransactionId - Payme's transaction ID.
     */
    private findSessionByPaymeTransactionId;
    /**
     * Fetch cart items for fiscalization (detail object).
     * Returns items with title, price, count, MXIK code for Payme receipt.
     * INCLUDES shipping costs to ensure sum matches transaction total.
     * MXIK is taken from product.metadata.mxik_code only.
     * @param cartId - Cart ID to fetch items for.
     * @param expectedTotal - Expected total in tiyins to validate sum matches.
     */
    private getCartItemsForFiscalization;
    /**
     * CheckPerformTransaction: Validate that a payment can be performed.
     * Called by Payme before CreateTransaction.
     */
    checkPerformTransaction(params: any): Promise<{
        allow: boolean;
        account: any;
        detail: {
            receipt_type: number;
            shipping: {
                title: string;
                price: number;
                address: string;
            };
            customer: {
                name: string;
                phone: string;
                address: string;
            };
            items: any[];
        };
    }>;
    /**
     * CreateTransaction: Create a new payment transaction.
     * Called by Payme after successful CheckPerformTransaction.
     */
    createTransaction(params: any): Promise<{
        create_time: any;
        transaction: any;
        state: any;
        account: any;
    }>;
    /**
     * PerformTransaction: Finalize a payment.
     * The `id` in params is our Session ID (returned from CreateTransaction).
     */
    performTransaction(params: any): Promise<{
        transaction: any;
        perform_time: any;
        state: number;
    }>;
    /**
     * CancelTransaction: Cancel a transaction.
     */
    cancelTransaction(params: any): Promise<{
        transaction: any;
        cancel_time: any;
        state: any;
    }>;
    /**
     * CheckTransaction: Get the status of a transaction.
     * Note: Payme sends their transaction ID, not our session ID.
     */
    checkTransaction(params: any): Promise<{
        create_time: any;
        perform_time: any;
        cancel_time: any;
        transaction: any;
        state: any;
        reason: any;
    }>;
    /**
     * GetStatement: Get list of transactions for a given period.
     * Used by Payme for reconciliation.
     */
    getStatement(params: any): Promise<{
        transactions: any;
    }>;
}
export {};
