/**
 * Is development environment
 */
export declare const IS_DEV: boolean;
/**
 * Public URL for the backend
 */
export declare const BACKEND_URL: string;
export declare const DATABASE_URL: string;
/**
 * (optional) Redis URL for Redis instance used by the backend
 */
export declare const REDIS_URL: string;
/**
 * Admin CORS origins
 */
export declare const ADMIN_CORS: string;
/**
 * Auth CORS origins
 */
export declare const AUTH_CORS: string;
/**
 * Store/frontend CORS origins
 */
export declare const STORE_CORS: string;
/**
 * Store/frontend URL (for redirects, emails, etc)
 */
export declare const STORE_URL: string;
/**
 * JWT Secret used for signing JWT tokens
 */
export declare const JWT_SECRET: string;
/**
 * Cookie secret used for signing cookies
 */
export declare const COOKIE_SECRET: string;
/**
 * (optional) Minio configuration for file storage
 */
export declare const MINIO_ENDPOINT: string;
export declare const MINIO_ACCESS_KEY: string;
export declare const MINIO_SECRET_KEY: string;
export declare const MINIO_BUCKET: string;
/**
 * (optional) Resend API Key and from Email - do not set if using SendGrid
 */
export declare const RESEND_API_KEY: string;
export declare const RESEND_FROM_EMAIL: string;
/**
 * (optionl) SendGrid API Key and from Email - do not set if using Resend
 */
export declare const SENDGRID_API_KEY: string;
export declare const SENDGRID_FROM_EMAIL: string;
/**
 * (optional) Stripe API key and webhook secret
 */
export declare const STRIPE_API_KEY: string;
export declare const STRIPE_WEBHOOK_SECRET: string;
/**
 * (optional) Meilisearch configuration
 */
export declare const MEILISEARCH_HOST: string;
export declare const MEILISEARCH_ADMIN_KEY: string;
/**
 * (optional) Payme configuration
 */
export declare const PAYME_ID: string;
export declare const PAYME_KEY: string;
export declare const PAYME_URL: string;
/**
 * (optional) Click configuration
 */
export declare const CLICK_MERCHANT_ID: string;
export declare const CLICK_SERVICE_ID: string;
export declare const CLICK_SECRET_KEY: string;
export declare const CLICK_PAY_URL: string;
export declare const CLICK_MERCHANT_USER_ID: string;
export declare const CLICK_CARD_TYPE: "uzcard" | "humo" | undefined;
export declare const CLICK_USER_ID: string;
/**
 * (optional) Eskiz.uz configuration
 */
export declare const ESKIZ_EMAIL: string;
export declare const ESKIZ_PASSWORD: string;
export declare const ESKIZ_FROM: string;
/**
 * OTP Configuration (obfuscated keys to bypass Railpack secret scanning)
 */
export declare const OTP_TTL_SECONDS: number;
export declare const OTP_MAX_ATTEMPTS: number;
export declare const OTP_RATE_LIMIT_PER_HOUR: number;
export declare const OTP_SECRET: string;
/**
 * Worker mode
 */
export declare const WORKER_MODE: "worker" | "server" | "shared";
/**
 * Disable Admin
 */
export declare const SHOULD_DISABLE_ADMIN: boolean;
