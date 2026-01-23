import { Migration } from "@mikro-orm/migrations"

export class Migration20260123000000 extends Migration {
  async up(): Promise<void> {
    // Create review table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "review" (
        "id" TEXT NOT NULL,
        "product_id" TEXT NOT NULL,
        "customer_id" TEXT NOT NULL,
        "order_id" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "title" TEXT,
        "comment" TEXT,
        "pros" TEXT,
        "cons" TEXT,
        "images" JSONB,
        "status" TEXT CHECK ("status" IN ('pending', 'approved', 'rejected', 'hidden')) NOT NULL DEFAULT 'pending',
        "rejection_reason" TEXT,
        "admin_response" TEXT,
        "admin_response_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "review_pkey" PRIMARY KEY ("id")
      );
    `)

    // Create indexes
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" 
      ON "review" ("deleted_at") 
      WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_review_product_id_status_created_at" 
      ON "review" ("product_id", "status", "created_at") 
      WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_review_customer_id" 
      ON "review" ("customer_id") 
      WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_review_order_id" 
      ON "review" ("order_id") 
      WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_review_product_id_customer_id" 
      ON "review" ("product_id", "customer_id") 
      WHERE "deleted_at" IS NULL;
    `)

    // Create partial unique index for active reviews
    // This allows only one active review (approved or pending) per product per customer
    // Users can submit a new review if their previous one was rejected/hidden
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_product_id_customer_id_active_unique" 
      ON "review" ("product_id", "customer_id") 
      WHERE "deleted_at" IS NULL 
        AND "status" IN ('approved', 'pending');
    `)
  }

  async down(): Promise<void> {
    // Drop indexes
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_product_id_customer_id_active_unique";
    `)

    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_product_id_customer_id";
    `)

    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_order_id";
    `)

    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_customer_id";
    `)

    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_product_id_status_created_at";
    `)

    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_deleted_at";
    `)

    // Drop table
    this.addSql(`
      DROP TABLE IF EXISTS "review" CASCADE;
    `)
  }
}
