/*
 * Fase E de la portada (docs/diseno/decisiones-home-ux9.md §18):
 * - `paginas_seccion_logos_logos`: los logos de la sección 4, tabla nueva y
 *   vacía. Sin logos, la sección no se pinta.
 * - `categorias_tecnicas.orden_portada`: columna NULLABLE y sin valor por
 *   defecto. Las categorías existentes quedan en NULL, «no sale en la
 *   portada», que es lo que ya pasaba: ningún dato cambia de significado
 *   (lección de §10.17).
 * Solo SQL: no usa la API local de Payload (§3.5).
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_seccion_logos_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"nombre" varchar
  );
  
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "orden_portada" numeric;
  ALTER TABLE "paginas_seccion_logos_logos" ADD CONSTRAINT "paginas_seccion_logos_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_seccion_logos_logos" ADD CONSTRAINT "paginas_seccion_logos_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_seccion_logos_logos_order_idx" ON "paginas_seccion_logos_logos" USING btree ("_order");
  CREATE INDEX "paginas_seccion_logos_logos_parent_id_idx" ON "paginas_seccion_logos_logos" USING btree ("_parent_id");
  CREATE INDEX "paginas_seccion_logos_logos_logo_idx" ON "paginas_seccion_logos_logos" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "paginas_seccion_logos_logos" CASCADE;
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "orden_portada";`)
}
