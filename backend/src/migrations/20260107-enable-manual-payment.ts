import { Migration } from "@mikro-orm/migrations";

export class Migration20260107EnableManualPayment extends Migration {
  async up(): Promise<void> {
    const regionId = "reg_01KAY0QXWMQSDRYZRGRCKE0GAN";
    const providerId = "pp_manual_manual";

    // 1. Ensure provider is installed
    const providerExists = await this.execute(
      `SELECT 1 FROM "payment_provider" WHERE id = '${providerId}'`
    );

    if (providerExists.length === 0) {
      await this.execute(
        `INSERT INTO "payment_provider" (id, is_installed) VALUES ('${providerId}', true)`
      );
    }

    // 2. Link to region
    const linkExists = await this.execute(
      `SELECT 1 FROM "region_payment_providers" WHERE region_id = '${regionId}' AND provider_id = '${providerId}'`
    );

    if (linkExists.length === 0) {
      await this.execute(
        `INSERT INTO "region_payment_providers" (region_id, provider_id) VALUES ('${regionId}', '${providerId}')`
      );
    }
  }

  async down(): Promise<void> {
    const regionId = "reg_01KAY0QXWMQSDRYZRGRCKE0GAN";
    const providerId = "pp_manual_manual";

    await this.execute(
      `DELETE FROM "region_payment_providers" WHERE region_id = '${regionId}' AND provider_id = '${providerId}'`
    );
    await this.execute(
      `DELETE FROM "payment_provider" WHERE id = '${providerId}'`
    );
  }
}
