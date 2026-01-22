import { Migration } from "@mikro-orm/migrations"

export class Migration20260122130000 extends Migration {
  async up(): Promise<void> {
    // Add pros, cons, images columns for marketplace-style reviews
    this.addSql(`
      ALTER TABLE "review" 
      ADD COLUMN IF NOT EXISTS "pros" TEXT,
      ADD COLUMN IF NOT EXISTS "cons" TEXT,
      ADD COLUMN IF NOT EXISTS "images" JSONB;
    `)

    // Update existing reviews to have empty images array if null
    this.addSql(`
      UPDATE "review" SET "images" = '[]'::jsonb WHERE "images" IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "review" 
      DROP COLUMN IF EXISTS "pros",
      DROP COLUMN IF EXISTS "cons",
      DROP COLUMN IF EXISTS "images";
    `)
  }
}
