import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_logo_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_portada_logo_id_media_id_fk" FOREIGN KEY ("portada_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_maquinaria_portada_portada_logo_idx" ON "marcas_maquinaria" USING btree ("portada_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_portada_logo_id_media_id_fk";
  
  DROP INDEX "marcas_maquinaria_portada_portada_logo_idx";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_logo_id";`)
}
