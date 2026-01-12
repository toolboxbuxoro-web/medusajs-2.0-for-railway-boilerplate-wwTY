"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createTestProduct;
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
async function createTestProduct({ container }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(utils_1.ContainerRegistrationKeys.QUERY);
    const salesChannelModuleService = container.resolve(utils_1.Modules.SALES_CHANNEL);
    logger.info("Creating test product with 5 images...");
    // 1. Get Uzbekistan region
    const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"],
        filters: {
            name: "Узбекистан",
        },
    });
    const uzRegion = regions[0];
    if (!uzRegion) {
        throw new Error("Uzbekistan region not found");
    }
    // 2. Get Default Sales Channel
    const [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
        name: "Default Sales Channel",
    });
    if (!defaultSalesChannel) {
        throw new Error("Default Sales Channel not found");
    }
    // 3. Get first shipping profile
    const { data: shippingProfiles } = await query.graph({
        entity: "shipping_profile",
        fields: ["id"],
    });
    const shippingProfileId = shippingProfiles[0]?.id;
    // 4. Create Product
    const productInput = {
        products: [
            {
                title: "Apple AirPods Max Matte Black",
                description: "Experience the ultimate listening experience with AirPods Max. High-fidelity audio, Active Noise Cancellation, and industry-leading battery life.",
                subtitle: "Premium Design. Cinematic Sound.",
                handle: "apple-airpods-max-test",
                status: utils_1.ProductStatus.PUBLISHED,
                shipping_profile_id: shippingProfileId,
                thumbnail: "http://localhost:9000/static/headphones-1.png",
                images: [
                    { url: "http://localhost:9000/static/headphones-1.png" },
                    { url: "http://localhost:9000/static/headphones-2.png" },
                    { url: "http://localhost:9000/static/headphones-3.png" },
                    { url: "http://localhost:9000/static/headphones-4.png" },
                    { url: "http://localhost:9000/static/headphones-5.png" },
                ],
                metadata: {
                    brand: "Apple",
                    warranty: "1 год официальной гарантии",
                    features: [
                        "Активное шумоподавление",
                        "Прозрачный режим",
                        "Пространственное аудио",
                        "До 20 часов работы"
                    ],
                    specifications: {
                        "Тип": "Полноразмерные",
                        "Подключение": "Bluetooth 5.0",
                        "Зарядка": "Lightning",
                        "Вес": "385 г"
                    }
                },
                options: [
                    {
                        title: "Color",
                        values: ["Matte Black"],
                    },
                ],
                variants: [
                    {
                        title: "Matte Black",
                        sku: "TEST-AIRPODS-MAX-BLK",
                        manage_inventory: false,
                        options: {
                            Color: "Matte Black",
                        },
                        prices: [
                            {
                                amount: 7500000,
                                currency_code: "uzs",
                            },
                        ],
                    },
                ],
                sales_channels: [
                    {
                        id: defaultSalesChannel.id,
                    },
                ],
            },
        ],
    };
    const { result } = await (0, core_flows_1.createProductsWorkflow)(container).run({
        input: productInput,
    });
    logger.info(`Test product created successfully! ID: ${result[0].id}`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXRlc3QtcHJvZHVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9zY3JpcHRzL2NyZWF0ZS10ZXN0LXByb2R1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFVQSxvQ0E0R0M7QUFySEQscURBSW1DO0FBQ25DLDREQUVxQztBQUV0QixLQUFLLFVBQVUsaUJBQWlCLENBQUMsRUFBRSxTQUFTLEVBQVk7SUFDckUsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxpQ0FBeUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRSxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pFLE1BQU0seUJBQXlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7SUFFM0UsTUFBTSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0lBRXRELDJCQUEyQjtJQUMzQixNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQU0sS0FBSyxDQUFDLEtBQUssQ0FBQztRQUMxQyxNQUFNLEVBQUUsUUFBUTtRQUNoQixNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLGVBQWUsQ0FBQztRQUN2QyxPQUFPLEVBQUU7WUFDUCxJQUFJLEVBQUUsWUFBWTtTQUNuQjtLQUNGLENBQUMsQ0FBQztJQUVILE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELCtCQUErQjtJQUMvQixNQUFNLENBQUMsbUJBQW1CLENBQUMsR0FBRyxNQUFNLHlCQUF5QixDQUFDLGlCQUFpQixDQUFDO1FBQzlFLElBQUksRUFB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