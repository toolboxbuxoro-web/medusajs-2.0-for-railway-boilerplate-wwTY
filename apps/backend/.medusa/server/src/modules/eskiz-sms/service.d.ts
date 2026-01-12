import { Logger, NotificationTypes } from '@medusajs/framework/types';
import { AbstractNotificationProviderService } from '@medusajs/framework/utils';
type InjectedDependencies = {
    logger: Logger;
};
interface EskizServiceConfig {
    email: string;
    password: string;
    from: string;
}
export interface EskizNotificationServiceOptions {
    email: string;
    password: string;
    from: string;
}
/**
 * Service to handle SMS notifications using the Eskiz.uz API.
 */
export declare class EskizNotificationService extends AbstractNotificationProviderService {
    static identifier: string;
    protected config_: EskizServiceConfig;
    protected logger_: Logger;
    protected cachedToken: {
        token: string;
        fetchedAt: number;
    } | null;
    protected baseUrl: string;
    constructor({ logger }: InjectedDependencies, options: EskizNotificationServiceOptions);
    private tokenIsFresh;
    private getToken;
    send(notification: NotificationTypes.ProviderSendNotificationDTO): Promise<NotificationTypes.ProviderSendNotificationResultsDTO>;
}
export {};
