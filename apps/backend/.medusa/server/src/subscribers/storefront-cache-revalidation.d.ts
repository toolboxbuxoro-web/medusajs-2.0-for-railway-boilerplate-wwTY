import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
export default function storefrontCacheHandler({ event, }: SubscriberArgs<Record<string, unknown>>): Promise<void>;
export declare const config: SubscriberConfig;
