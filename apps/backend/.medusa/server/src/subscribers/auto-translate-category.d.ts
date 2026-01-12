import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
export default function autoTranslateCategory({ event: { data }, container, }: SubscriberArgs<{
    id: string;
}>): Promise<void>;
export declare const config: SubscriberConfig;
