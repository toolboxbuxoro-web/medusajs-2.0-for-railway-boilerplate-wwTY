import { Migration } from '@mikro-orm/migrations';

/**
 * Update unique constraint to allow multiple reviews per product+customer
 * if previous reviews were rejected or hidden.
 * 
 * Business rule: 1 active review (approved or pending) per product per customer.
 * Users can submit a new review if their previous one was rejected/hidden.
 */
export class Migration20260121130000 extends Migration {

  override async up(): Promise<void> {
    // Drop the old unique index that didn't consider status
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_product_id_customer_id_unique";
    `);

    // Create a new partial unique index that only enforces uniqueness
    // for active reviews (approved or pending)
    // This allows users to submit new reviews if their previous one was rejected/hidden
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_product_id_customer_id_active_unique" 
      ON "review" (product_id, customer_id) 
      WHERE deleted_at IS NULL 
        AND status IN ('approved', 'pending');
    `);
  }

  override async down(): Promise<void> {
    // Restore the old unique index (without status filter)
    this.addSql(`
      DROP INDEX IF EXISTS "IDX_review_product_id_customer_id_active_unique";
    `);

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_product_id_customer_id_unique" 
      ON "review" (product_id, customer_id) 
      WHERE deleted_at IS NULL;
    `);
  }

}
