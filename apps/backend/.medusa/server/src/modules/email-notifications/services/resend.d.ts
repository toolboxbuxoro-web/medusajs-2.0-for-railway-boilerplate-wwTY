import { Logger, NotificationTypes } from '@medusajs/framework/types';
import { AbstractNotificationProviderService } from '@medusajs/framework/utils';
import { Resend } from 'resend';
type InjectedDependencies = {
    logger: Logger;
};
interface ResendServiceConfig {
    apiKey: string;
    from: string;
}
export interface ResendNotificationServiceOptions {
    api_key: string;
    from: string;
}
/**
 * Service to handle email notifications using the Resend API.
 */
export declare class ResendNotificationService extends AbstractNotificationProviderService {
    static identifier: string;
    protected config_: ResendServiceConfig;
    protected logger_: Logger;
    protected resend: Resend;
    constructor({ logger }: InjectedDependencies, options: ResendNotificationServiceOptions);
    send(notification: NotificationTypes.ProviderSendNotificationDTO): Promise<NotificationTypes.ProviderSendNotificationResultsDTO>;
}
export {};
