/*
 * Fase H de la portada (docs/diseno/decisiones-home-ux9.md §20): el YouTube
 * de cada testimonio y la máquina decorativa de la sección 11. Dos columnas
 * NULLABLE y sin valor por defecto: los testimonios existentes quedan «sin
 * YouTube» y la portada «sin imagen», que es lo que ya mostraban. Ningún dato
 * cambia de significado (lección de §10.17). Solo SQL: no usa la API local de
 * Payload (§3.5).
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_faq_imagen_id" integer;
  ALTER TABLE "testimonios" ADD COLUMN "youtube" varchar;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_faq_imagen_id_media_id_fk" FOREIGN KEY ("seccion_faq_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_faq_seccion_faq_imagen_idx" ON "paginas" USING btree ("seccion_faq_imagen_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_faq_imagen_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_faq_seccion_faq_imagen_idx";
  ALTER TABLE "paginas" DROP COLUMN "seccion_faq_imagen_id";
  ALTER TABLE "testimonios" DROP COLUMN "youtube";`)
}
