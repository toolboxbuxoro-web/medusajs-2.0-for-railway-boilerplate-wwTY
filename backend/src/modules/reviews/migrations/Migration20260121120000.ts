import { Migration } from '@mikro-orm/migrations';

export class Migration20260121120000 extends Migration {

  override async up(): Promise<void> {
    // Update status values and default to support hybrid moderation:
    // - add "hidden"
    // - default to "approved" (auto-published)

    // Relax existing rows before tightening the constraint.
    this.addSql(`update "review" set status = 'approved' where status = 'pending';`);

    this.addSql(`alter table if exists "review" drop constraint if exists "review_status_check";`);
    this.addSql(
      `alter table if exists "review" add constraint "review_status_check" check ("status" in ('pending', 'approved', 'rejected', 'hidden'));`,
    );
    this.addSql(
      `alter table if exists "review" alter column "status" set default 'approved';`,
    );
  }

  override async down(): Promise<void> {
    // Roll back to original enum and default.

    // Move "hidden" and "approved" back to "pending" before restoring constraint.
    this.addSql(`update "review" set status = 'pending' where status in ('approved', 'hidden');`);

    this.addSql(`alter table if exists "review" drop constraint if exists "review_status_check";`);
    this.addSql(
      `alter table if exists "review" add constraint "review_status_check" check ("status" in ('pending', 'approved', 'rejected'));`,
    );
    this.addSql(
      `alter table if exists "review" alter column "status" set default 'pending';`,
    );
  }

}

