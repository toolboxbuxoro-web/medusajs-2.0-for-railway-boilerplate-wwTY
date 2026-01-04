import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function createTestProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

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
        status: ProductStatus.PUBLISHED,
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

  const { result } = await createProductsWorkflow(container).run({
    input: productInput,
  });

  logger.info(`Test product created successfully! ID: ${result[0].id}`);
}
