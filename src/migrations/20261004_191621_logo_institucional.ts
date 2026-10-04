import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo" ADD COLUMN "logo_id" integer;
  ALTER TABLE "seo" ADD CONSTRAINT "seo_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "seo_logo_idx" ON "seo" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "seo" DROP CONSTRAINT "seo_logo_id_media_id_fk";
  
  DROP INDEX "seo_logo_idx";
  ALTER TABLE "seo" DROP COLUMN "logo_id";`)
}
