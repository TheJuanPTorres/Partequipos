/*
 * Recorte vertical OPCIONAL del fondo del hero para móvil (CLAUDE.md §10.36).
 * Columna NULLABLE y sin valor por defecto: las diapositivas existentes quedan
 * en NULL, «sin recorte», y siguen usando la foto de escritorio como hasta hoy.
 * Ningún dato cambia de significado (lección de §10.17). Solo SQL: no usa la
 * API local de Payload (§3.5).
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "imagen_fondo_movil_id" integer;
  ALTER TABLE "paginas_hero_diapositivas" ADD CONSTRAINT "paginas_hero_diapositivas_imagen_fondo_movil_id_media_id_fk" FOREIGN KEY ("imagen_fondo_movil_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_hero_diapositivas_imagen_fondo_movil_idx" ON "paginas_hero_diapositivas" USING btree ("imagen_fondo_movil_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_hero_diapositivas" DROP CONSTRAINT "paginas_hero_diapositivas_imagen_fondo_movil_id_media_id_fk";
  
  DROP INDEX "paginas_hero_diapositivas_imagen_fondo_movil_idx";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "imagen_fondo_movil_id";`)
}
