"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const utils_1 = require("@medusajs/utils");
// Trigger restart
const constants_1 = require("lib/constants");
(0, utils_1.loadEnv)(process.env.NODE_ENV, process.cwd());
// Debug: Log Eskiz configuration status
console.log(`[Config] Eskiz SMS: ${constants_1.ESKIZ_EMAIL && constants_1.ESKIZ_PASSWORD ? 'ENABLED (' + constants_1.ESKIZ_EMAIL + ')' : 'DISABLED (missing ESKIZ_EMAIL or ESKIZ_PASSWORD)'}`);
const medusaConfig = {
    projectConfig: {
        databaseUrl: constants_1.DATABASE_URL,
        databaseLogging: false,
        redisUrl: constants_1.REDIS_URL,
        workerMode: constants_1.WORKER_MODE,
        http: {
            adminCors: constants_1.ADMIN_CORS,
            authCors: constants_1.AUTH_CORS.includes('toolbox-tools.uz') && !constants_1.AUTH_CORS.includes('www.toolbox-tools.uz')
                ? `${constants_1.AUTH_CORS},https://www.toolbox-tools.uz`
                : constants_1.AUTH_CORS,
            storeCors: constants_1.STORE_CORS.includes('toolbox-tools.uz') && !constants_1.STORE_CORS.includes('www.toolbox-tools.uz')
                ? `${constants_1.STORE_CORS},https://www.toolbox-tools.uz`
                : constants_1.STORE_CORS,
            jwtSecret: constants_1.JWT_SECRET,
            cookieSecret: constants_1.COOKIE_SECRET,
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
        backendUrl: constants_1.BACKEND_URL,
        disable: constants_1.SHOULD_DISABLE_ADMIN,
    },
    modules: [
        ...(constants_1.REDIS_URL ? [{
                key: utils_1.Modules.CACHE,
                resolve: "@medusajs/cache-redis",
                options: {
                    redisUrl: constants_1.REDIS_URL,
                },
            }] : []),
        {
            key: "moysklad",
            resolve: "./src/modules/moysklad",
        },
        {
            key: utils_1.Modules.FILE,
            resolve: '@medusajs/file',
            options: {
                providers: [
                    ...(constants_1.MINIO_ENDPOINT && constants_1.MINIO_ACCESS_KEY && constants_1.MINIO_SECRET_KEY ? [{
                            resolve: './src/modules/minio-file',
                            id: 'minio',
                            options: {
                                endPoint: constants_1.MINIO_ENDPOINT,
                                accessKey: constants_1.MINIO_ACCESS_KEY,
                                secretKey: constants_1.MINIO_SECRET_KEY,
                                bucket: constants_1.MINIO_BUCKET // Optional, default: medusa-media
                            }
                        }] : [{
                            resolve: '@medusajs/file-local',
                            id: 'local',
                            options: {
                                upload_dir: 'static',
                                backend_url: `${constants_1.BACKEND_URL}/static`
                            }
                        }])
                ]
            }
        },
        ...(constants_1.REDIS_URL ? [{
                key: utils_1.Modules.EVENT_BUS,
                resolve: '@medusajs/event-bus-redis',
                options: {
                    redisUrl: constants_1.REDIS_URL
                }
            },
            {
                key: utils_1.Modules.WORKFLOW_ENGINE,
                resolve: '@medusajs/workflow-engine-redis',
                options: {
                    redis: {
                        url: constants_1.REDIS_URL,
                    }
                }
            }] : []),
        ...((constants_1.SENDGRID_API_KEY && constants_1.SENDGRID_FROM_EMAIL) || (constants_1.RESEND_API_KEY && constants_1.RESEND_FROM_EMAIL) || (constants_1.ESKIZ_EMAIL && constants_1.ESKIZ_PASSWORD) ? [{
                key: utils_1.Modules.NOTIFICATION,
                resolve: '@medusajs/notification',
                options: {
                    providers: [
                        ...(constants_1.SENDGRID_API_KEY && constants_1.SENDGRID_FROM_EMAIL ? [{
                                resolve: '@medusajs/notification-sendgrid',
                                id: 'sendgrid',
                                options: {
                                    channels: ['email'],
                                    api_key: constants_1.SENDGRID_API_KEY,
                                    from: constants_1.SENDGRID_FROM_EMAIL,
                                }
                            }] : []),
                        ...(constants_1.RESEND_API_KEY && constants_1.RESEND_FROM_EMAIL ? [{
                                resolve: './src/modules/email-notifications',
                                id: 'resend',
                                options: {
                                    channels: ['email'],
                                    api_key: constants_1.RESEND_API_KEY,
                                    from: constants_1.RESEND_FROM_EMAIL,
                                },
                            }] : []),
                        ...(constants_1.ESKIZ_EMAIL && constants_1.ESKIZ_PASSWORD ? [{
                                resolve: './src/modules/eskiz-sms',
                                id: 'eskiz',
                                options: {
                                    channels: ['sms'],
                                    email: constants_1.ESKIZ_EMAIL,
                                    password: constants_1.ESKIZ_PASSWORD,
                                    from: constants_1.ESKIZ_FROM,
                                },
                            }] : []),
                    ]
                }
            }] : []),
        {
            key: utils_1.Modules.PAYMENT,
            resolve: '@medusajs/payment',
            options: {
                providers: [
                    ...(constants_1.STRIPE_API_KEY && constants_1.STRIPE_WEBHOOK_SECRET ? [{
                            resolve: '@medusajs/payment-stripe',
                            id: 'stripe',
                            options: {
                                apiKey: constants_1.STRIPE_API_KEY,
                                webhookSecret: constants_1.STRIPE_WEBHOOK_SECRET,
                            },
                        }] : []),
                    ...(constants_1.PAYME_ID && constants_1.PAYME_KEY ? [{
                            resolve: './src/modules/payment-payme',
                            id: 'payme',
                            options: {
                                payme_id: constants_1.PAYME_ID,
                                payme_key: constants_1.PAYME_KEY,
                                payme_url: constants_1.PAYME_URL,
                            },
                        }, console.log("✅ Payme provider added to config") && undefined].filter(Boolean) : [console.log("❌ Payme provider NOT added: Missing ID or KEY") && undefined].filter(Boolean)),
                    ...(constants_1.CLICK_MERCHANT_ID && constants_1.CLICK_SERVICE_ID && constants_1.CLICK_SECRET_KEY ? [
                        {
                            resolve: './src/modules/payment-click',
                            id: 'click',
                            options: {
                                merchant_id: constants_1.CLICK_MERCHANT_ID,
                                service_id: constants_1.CLICK_SERVICE_ID,
                                secret_key: constants_1.CLICK_SECRET_KEY,
                                pay_url: constants_1.CLICK_PAY_URL,
                                merchant_user_id: constants_1.CLICK_MERCHANT_USER_ID,
                            },
                        },
                        {
                            resolve: './src/modules/payment-click',
                            id: 'click_pay_by_card',
                            options: {
                                merchant_id: constants_1.CLICK_MERCHANT_ID,
                                service_id: constants_1.CLICK_SERVICE_ID,
                                secret_key: constants_1.CLICK_SECRET_KEY,
                                pay_url: constants_1.CLICK_PAY_URL,
                                merchant_user_id: constants_1.CLICK_MERCHANT_USER_ID,
                                card_type: constants_1.CLICK_CARD_TYPE,
                            },
                        },
                        console.log("✅ Click providers added to config") && undefined,
                    ].filter(Boolean) : [console.log("❌ Click providers NOT added: Missing CLICK_MERCHANT_ID/CLICK_SERVICE_ID/CLICK_SECRET_KEY") && undefined].filter(Boolean)),
                ],
            },
        }
    ],
    plugins: [
        ...(constants_1.MEILISEARCH_HOST && constants_1.MEILISEARCH_ADMIN_KEY ? [{
                resolve: '@rokmohar/medusa-plugin-meilisearch',
                options: {
                    config: {
                        host: constants_1.MEILISEARCH_HOST,
                        apiKey: constants_1.MEILISEARCH_ADMIN_KEY
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
/** @type {import('@medusajs/types').ConfigModule} */
const config = (0, utils_1.defineConfig)(medusaConfig);
exports.default = config;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkdXNhLWNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL21lZHVzYS1jb25maWcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxjQUFjO0FBQ2QsMkNBQWlFO0FBQ2pFLGtCQUFrQjtBQUNsQiw2Q0FtQ3VCO0FBRXZCLElBQUEsZUFBTyxFQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBRTdDLHdDQUF3QztBQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1Qix1QkFBVyxJQUFJLDBCQUFjLENBQUMsQ0FBQyxDQUFDLFdBQVcsR0FBRyx1QkFBVyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0RBQWtELEVBQUUsQ0FBQyxDQUFDO0FBRTNKLE1BQU0sWUFBWSxHQUFHO0lBQ25CLGFBQWEsRUFBRTtRQUNiLFdBQVcsRUFBRSx3QkFBWTtRQUN6QixlQUFlLEVBQUUsS0FBSztRQUN0QixRQUFRLEVBQUUscUJBQVM7UUFDbkIsVUFBVSxFQUFFLHVCQUFXO1FBQ3ZCLElBQUksRUFBRTtZQUNKLFNBQVMsRUFBRSxzQkFBVTtZQUNyQixRQUFRLEVBQUUscUJBQVMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHFCQUFTLENBQUMsUUFBUSxDQUFDLHNCQUFzQixDQUFDO2dCQUM3RixDQUFDLENBQUMsR0FBRyxxQkFBUywrQkFBK0I7Z0JBQzdDLENBQUMsQ0FBQyxxQkFBUztZQUNiLFNBQVMsRUFBRSxzQkFBVSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsc0JBQVUsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUM7Z0JBQ2hHLENBQUMsQ0FBQyxHQUFHLHNCQUFVLCtCQUErQjtnQkFDOUMsQ0FBQyxDQUFDLHNCQUFVO1lBQ2QsU0FBUyxFQUFFLHNCQUFVO1lBQ3JCLFlBQVksRUFBRSx5QkFBYTtZQUMzQixJQUFJ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