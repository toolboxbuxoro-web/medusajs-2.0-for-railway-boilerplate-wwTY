import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
// Trigger restart
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  PAYME_ID,
  PAYME_KEY,
  PAYME_URL,
  CLICK_MERCHANT_ID,
  CLICK_SERVICE_ID,
  CLICK_SECRET_KEY,
  CLICK_PAY_URL,
  CLICK_MERCHANT_USER_ID,
  CLICK_CARD_TYPE,
  ESKIZ_EMAIL,
  ESKIZ_PASSWORD,
  ESKIZ_FROM
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());


const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS.includes('toolbox-tools.uz') && !AUTH_CORS.includes('www.toolbox-tools.uz')
        ? `${AUTH_CORS},https://www.toolbox-tools.uz`
        : AUTH_CORS,
      storeCors: STORE_CORS.includes('toolbox-tools.uz') && !STORE_CORS.includes('www.toolbox-tools.uz')
        ? `${STORE_CORS},https://www.toolbox-tools.uz`
        : STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
      port: process.env.PORT ? parseInt(process.env.PORT) : 9000,
      host: process.env.HOST || '0.0.0.0'
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard"]
      }
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    {
      key: "moysklad",
      resolve: "./src/modules/moysklad",
    },
    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: './src/modules/minio-file',
            id: 'minio',
            options: {
              endPoint: MINIO_ENDPOINT,
              accessKey: MINIO_ACCESS_KEY,
              secretKey: MINIO_SECRET_KEY,
              bucket: MINIO_BUCKET // Optional, default: medusa-media
            }
          }] : [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${BACKEND_URL}/static`
            }
          }])
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        }
      }
    }] : []),
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
          ...(ESKIZ_EMAIL && ESKIZ_PASSWORD ? [{
            resolve: './src/modules/eskiz-sms',
            id: 'eskiz',
            options: {
              channels: ['sms'],
              email: ESKIZ_EMAIL,
              password: ESKIZ_PASSWORD,
              from: ESKIZ_FROM,
            },
          }] : []),
        ]
      }
    }] : []),
    {
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          }] : []),
          ...(PAYME_ID && PAYME_KEY ? [{
            resolve: './src/modules/payment-payme',
            id: 'payme',
            options: {
              payme_id: PAYME_ID,
              payme_key: PAYME_KEY,
              payme_url: PAYME_URL,
            },
          }, console.log("✅ Payme provider added to config") && undefined].filter(Boolean) : [console.log("❌ Payme provider NOT added: Missing ID or KEY") && undefined].filter(Boolean)),
          ...(CLICK_MERCHANT_ID && CLICK_SERVICE_ID && CLICK_SECRET_KEY ? [
            {
              resolve: './src/modules/payment-click',
              id: 'click',
              options: {
                merchant_id: CLICK_MERCHANT_ID,
                service_id: CLICK_SERVICE_ID,
                secret_key: CLICK_SECRET_KEY,
                pay_url: CLICK_PAY_URL,
                merchant_user_id: CLICK_MERCHANT_USER_ID,
              },
            },
            {
              resolve: './src/modules/payment-click',
              id: 'click_pay_by_card',
              options: {
                merchant_id: CLICK_MERCHANT_ID,
                service_id: CLICK_SERVICE_ID,
                secret_key: CLICK_SECRET_KEY,
                pay_url: CLICK_PAY_URL,
                merchant_user_id: CLICK_MERCHANT_USER_ID,
                card_type: CLICK_CARD_TYPE,
              },
            },
            console.log("✅ Click providers added to config") && undefined,
          ].filter(Boolean) : [console.log("❌ Click providers NOT added: Missing CLICK_MERCHANT_ID/CLICK_SERVICE_ID/CLICK_SECRET_KEY") && undefined].filter(Boolean)),
        ],
      },
    }
  ],
  plugins: [
    ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_ADMIN_KEY
        },
        settings: {
          products: {
            type: 'products',
            enabled: true,
            fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
            indexSettings: {
              searchableAttributes: ['title', 'description', 'variant_sku'],
              displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
              filterableAttributes: ['id', 'handle'],
            },
            primaryKey: 'id',
          }
        }
      }
    }] : [])
  ]
};

export default defineConfig(medusaConfig);
