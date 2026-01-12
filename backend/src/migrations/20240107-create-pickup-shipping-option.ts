// Migration to add a zero‑price Pickup shipping option for Uzbekistan
// Medusa uses MikroORM migrations – this file follows the standard pattern.

import { Migration } from "@mikro-orm/migrations";

export class Migration20240107CreatePickupShippingOption extends Migration {
  async up(): Promise<void> {
    // Region ID for Uzbekistan (as observed in the system)
    const regionId = "reg_01KAY0QXWMQSDRYZRGRCKE0GAN";
    // Use a deterministic ID for reproducibility
    const optionId = "so_pickup_uzb_0001";

    // Insert the shipping option with price 0, flat pricing, manual provider.
    await this.execute(
      `INSERT INTO "shipping_option" (id, name, price_type, amount, region_id, provider_id, data, is_return, admin_only, includes_tax, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())`,
      [
        optionId,
        "Самовывоз", // name displayed in storefront
        "flat",
        0,
        regionId,
        "manual", // provider for manual/pickup options
        JSON.stringify({ fulfillment_type: "pickup" }),
        false,
        false,
        false,
      ]
    );
  }

  async down(): Promise<void> {
    await this.execute(`DELETE FROM "shipping_option" WHERE id = $1`, ["so_pickup_uzb_0001"]);
  }
}
