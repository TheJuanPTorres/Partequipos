import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "testimonios" ALTER COLUMN "cita" DROP NOT NULL;
  ALTER TABLE "testimonios" ADD COLUMN "video_del_cliente" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "testimonios" SET "cita" = '' WHERE "cita" IS NULL;
  ALTER TABLE "testimonios" ALTER COLUMN "cita" SET NOT NULL;
  ALTER TABLE "testimonios" DROP COLUMN "video_del_cliente";`)
}
