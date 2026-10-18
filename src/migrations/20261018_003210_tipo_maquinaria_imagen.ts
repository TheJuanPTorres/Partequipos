import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tipos_maquinaria" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "tipos_maquinaria" ADD CONSTRAINT "tipos_maquinaria_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tipos_maquinaria_imagen_idx" ON "tipos_maquinaria" USING btree ("imagen_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tipos_maquinaria" DROP CONSTRAINT "tipos_maquinaria_imagen_id_media_id_fk";
  
  DROP INDEX "tipos_maquinaria_imagen_idx";
  ALTER TABLE "tipos_maquinaria" DROP COLUMN "imagen_id";`)
}
