import { ReactNode } from 'react';
import { InviteUserEmail } from './invite-user';
import { OrderPlacedTemplate } from './order-placed';
export declare const EmailTemplates: {
    readonly INVITE_USER: "invite-user";
    readonly ORDER_PLACED: "order-placed";
};
export type EmailTemplateType = keyof typeof EmailTemplates;
export declare function generateEmailTemplate(templateKey: string, data: unknown): ReactNode;
export { InviteUserEmail, OrderPlacedTemplate };
