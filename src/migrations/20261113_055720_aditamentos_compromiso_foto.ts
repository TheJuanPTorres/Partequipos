import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_foto_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_plantilla_aditamentos_foto_id_media_id_fk" FOREIGN KEY ("plantilla_aditamentos_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_maquinaria_plantilla_aditamentos_plantilla_aditam_idx" ON "marcas_maquinaria" USING btree ("plantilla_aditamentos_foto_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_plantilla_aditamentos_foto_id_media_id_fk";
  
  DROP INDEX "marcas_maquinaria_plantilla_aditamentos_plantilla_aditam_idx";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_foto_id";`)
}
