import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" ADD COLUMN "video_cabecera_id" integer;
  ALTER TABLE "marcas_lubricante" ADD CONSTRAINT "marcas_lubricante_video_cabecera_id_videos_id_fk" FOREIGN KEY ("video_cabecera_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_lubricante_video_cabecera_idx" ON "marcas_lubricante" USING btree ("video_cabecera_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" DROP CONSTRAINT "marcas_lubricante_video_cabecera_id_videos_id_fk";
  
  DROP INDEX "marcas_lubricante_video_cabecera_idx";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "video_cabecera_id";`)
}
