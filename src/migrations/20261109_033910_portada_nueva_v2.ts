import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_maquina_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_distribuidor_nombre" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_distribuidor_logo_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_fondo_tarjetas_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_portada_maquina_id_media_id_fk" FOREIGN KEY ("portada_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_portada_distribuidor_logo_id_media_id_fk" FOREIGN KEY ("portada_distribuidor_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_nueva_fondo_tarjetas_id_media_id_fk" FOREIGN KEY ("seccion_nueva_fondo_tarjetas_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_maquinaria_portada_portada_maquina_idx" ON "marcas_maquinaria" USING btree ("portada_maquina_id");
  CREATE INDEX "marcas_maquinaria_portada_portada_distribuidor_logo_idx" ON "marcas_maquinaria" USING btree ("portada_distribuidor_logo_id");
  CREATE INDEX "paginas_seccion_nueva_seccion_nueva_fondo_tarjetas_idx" ON "paginas" USING btree ("seccion_nueva_fondo_tarjetas_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_portada_maquina_id_media_id_fk";
  
  ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_portada_distribuidor_logo_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_nueva_fondo_tarjetas_id_media_id_fk";
  
  DROP INDEX "marcas_maquinaria_portada_portada_maquina_idx";
  DROP INDEX "marcas_maquinaria_portada_portada_distribuidor_logo_idx";
  DROP INDEX "paginas_seccion_nueva_seccion_nueva_fondo_tarjetas_idx";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_maquina_id";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_distribuidor_nombre";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_distribuidor_logo_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_fondo_tarjetas_id";`)
}
