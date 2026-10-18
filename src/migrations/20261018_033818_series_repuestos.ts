import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Series de los tipos de repuestos (2026-10-17, dirección): «Series» en
 * `tipos-equipo` (nombre y foto, en el orden de las filas) y «Serie» en
 * `modelos-repuesto`. Solo esquema: los datos de Hitachi los pone
 * `scripts/repuestos/series.ts` (preview) y su runbook (sitio publicado).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tipos_equipo_series" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"imagen_id" integer
  );
  
  ALTER TABLE "modelos_repuesto" ADD COLUMN "serie" varchar;
  ALTER TABLE "tipos_equipo_series" ADD CONSTRAINT "tipos_equipo_series_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_equipo_series" ADD CONSTRAINT "tipos_equipo_series_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tipos_equipo_series_order_idx" ON "tipos_equipo_series" USING btree ("_order");
  CREATE INDEX "tipos_equipo_series_parent_id_idx" ON "tipos_equipo_series" USING btree ("_parent_id");
  CREATE INDEX "tipos_equipo_series_imagen_idx" ON "tipos_equipo_series" USING btree ("imagen_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "tipos_equipo_series" CASCADE;
  ALTER TABLE "modelos_repuesto" DROP COLUMN IF EXISTS "serie";`)
}
