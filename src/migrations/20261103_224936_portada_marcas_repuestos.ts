import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_marcas_repuestos_antetitulo" varchar DEFAULT 'Repuestos';
  ALTER TABLE "paginas" ADD COLUMN "seccion_marcas_repuestos_titulo" varchar DEFAULT 'Repuestos para';
  ALTER TABLE "paginas" ADD COLUMN "seccion_marcas_repuestos_titulo_resaltado" varchar DEFAULT 'las marcas que trabajas';
  ALTER TABLE "paginas" ADD COLUMN "seccion_marcas_repuestos_maquina_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_marcas_repuestos_tamano_maquina" numeric DEFAULT 100;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_marcas_repuestos_maquina_id_media_id_fk" FOREIGN KEY ("seccion_marcas_repuestos_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_marcas_repuestos_seccion_marcas_repuesto_idx" ON "paginas" USING btree ("seccion_marcas_repuestos_maquina_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_marcas_repuestos_maquina_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_marcas_repuestos_seccion_marcas_repuesto_idx";
  ALTER TABLE "paginas" DROP COLUMN "seccion_marcas_repuestos_antetitulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_marcas_repuestos_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_marcas_repuestos_titulo_resaltado";
  ALTER TABLE "paginas" DROP COLUMN "seccion_marcas_repuestos_maquina_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_marcas_repuestos_tamano_maquina";`)
}
