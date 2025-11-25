import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function seedTools({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  logger.info("Seeding electric tools...");

  // 1. Get Default Sales Channel
  const [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel) {
    logger.error("Default Sales Channel not found. Please run the main seed script first.");
    return;
  }

  // 2. Get Default Shipping Profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default"
  });
  const shippingProfile = shippingProfiles[0];

  if (!shippingProfile) {
    logger.error("Default Shipping Profile not found. Please run the main seed script first.");
    return;
  }

  // 3. Create Category
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Electric Tools",
          handle: "electric-tools",
          is_active: true,
        },
      ],
    },
  });

  const categoryId = categoryResult[0].id;

  // 4. Create Products
  const productsData = [
    {
      title: "Cordless Drill 18V",
      subtitle: "Дрель-шуруповерт аккумуляторная",
      description: "Powerful 18V cordless drill driver with 2-speed gearbox and 13mm metal chuck. Perfect for drilling in wood, metal, and masonry. Includes 2 batteries and charger. \n\nМощная 18В аккумуляторная дрель-шуруповерт с 2-скоростным редуктором и 13мм металлическим патроном. Идеально подходит для сверления дерева, металла и кирпича. В комплекте 2 аккумулятора и зарядное устройство.",
      handle: "cordless-drill-18v",
      weight: 1500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId],
      images: [
        { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" } // Placeholder image
      ],
      options: [
        { title: "Kit", values: ["Basic", "Pro"] }
      ],
      variants: [
        {
          title: "Basic Kit",
          sku: "DRILL-18V-BASIC",
          options: { Kit: "Basic" },
          prices: [
            { amount: 50, currency_code: "usd" },
            { amount: 45, currency_code: "eur" },
            { amount: 500000, currency_code: "uzs" } // Approx 50 USD
          ]
        }
      ],
      sales_channels: [{ id: defaultSalesChannel.id }]
    },
    {
      title: "Angle Grinder 125mm",
      subtitle: "Угловая шлифмашина (Болгарка)",
      description: "Compact 900W angle grinder for 125mm discs. Features restart protection and soft start. Ideal for cutting and grinding metal and stone. \n\nКомпактная угловая шлифмашина 900Вт для дисков 125мм. Имеет защиту от повторного пуска и плавный пуск. Идеальна для резки и шлифовки металла и камня.",
      handle: "angle-grinder-125mm",
      weight: 2000,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId],
      images: [
        { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" } // Placeholder
      ],
      options: [
        { title: "Power", values: ["900W"] }
      ],
      variants: [
        {
          title: "900W Standard",
          sku: "GRINDER-125-900W",
          options: { Power: "900W" },
          prices: [
            { amount: 40, currency_code: "usd" },
            { amount: 35, currency_code: "eur" },
            { amount: 400000, currency_code: "uzs" }
          ]
        }
      ],
      sales_channels: [{ id: defaultSalesChannel.id }]
    },
    {
      title: "Professional Jigsaw",
      subtitle: "Электролобзик профессиональный",
      description: "High-performance jigsaw with pendulum action and tool-free blade change. Variable speed control for precise cutting in various materials. \n\nВысокопроизводительный электролобзик с маятниковым ходом и безинструментальной заменой пилки. Регулировка скорости для точной резки различных материалов.",
      handle: "pro-jigsaw",
      weight: 2300,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId],
      images: [
        { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png" } // Placeholder
      ],
      options: [
        { title: "Type", values: ["Corded"] }
      ],
      variants: [
        {
          title: "Corded Model",
          sku: "JIGSAW-PRO",
          options: { Type: "Corded" },
          prices: [
            { amount: 60, currency_code: "usd" },
            { amount: 55, currency_code: "eur" },
            { amount: 600000, currency_code: "uzs" }
          ]
        }
      ],
      sales_channels: [{ id: defaultSalesChannel.id }]
    },
    {
      title: "Rotary Hammer SDS+",
      subtitle: "Перфоратор SDS+",
      description: "Heavy-duty rotary hammer with 3 modes: drilling, hammer drilling, and chiseling. 2.7J impact energy for fast drilling in concrete. \n\nМощный перфоратор с 3 режимами: сверление, сверление с ударом и долбление. Энергия удара 2.7Дж для быстрого сверления бетона.",
      handle: "rotary-hammer-sds",
      weight: 3000,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId],
      images: [
        { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" } // Placeholder
      ],
      options: [
        { title: "Case", values: ["Plastic Case"] }
      ],
      variants: [
        {
          title: "With Case",
          sku: "HAMMER-SDS-CASE",
          options: { Case: "Plastic Case" },
          prices: [
            { amount: 120, currency_code: "usd" },
            { amount: 110, currency_code: "eur" },
            { amount: 1200000, currency_code: "uzs" }
          ]
        }
      ],
      sales_channels: [{ id: defaultSalesChannel.id }]
    },
    {
      title: "Circular Saw 190mm",
      subtitle: "Циркулярная пила 190мм",
      description: "Robust circular saw for precise straight cuts in wood. 66mm cutting depth and adjustable bevel angle up to 45 degrees. \n\nНадежная циркулярная пила для точных прямых пропилов в дереве. Глубина пропила 66мм и регулируемый угол наклона до 45 градусов.",
      handle: "circular-saw-190",
      weight: 4000,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: [categoryId],
      images: [
        { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" } // Placeholder
      ],
      options: [
        { title: "Blade", values: ["Included"] }
      ],
      variants: [
        {
          title: "Standard",
          sku: "SAW-CIRC-190",
          options: { Blade: "Included" },
          prices: [
            { amount: 85, currency_code: "usd" },
            { amount: 80, currency_code: "eur" },
            { amount: 850000, currency_code: "uzs" }
          ]
        }
      ],
      sales_channels: [{ id: defaultSalesChannel.id }]
    }
  ];

  await createProductsWorkflow(container).run({
    input: {
      products: productsData
    }
  });

  logger.info("Finished seeding electric tools.");
}
