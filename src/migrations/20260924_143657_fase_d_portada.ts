/*
 * FASE D DE LA PORTADA — y una deriva de esquema pendiente.
 *
 * 1. `paginas.seccion_usada_imagen_id`: la máquina recortada de la sección 3.
 *    Columna NULLABLE y SIN valor por defecto: las filas existentes quedan en
 *    NULL, que es «sin imagen», y la sección se pinta sin ella. Ningún dato
 *    existente cambia de significado.
 *
 * 2. `videos.focal_x` / `videos.focal_y`: DERIVA DE LA FASE C. El commit
 *    0d2dbd3 puso `focalPoint: false` en `Video` sin generar migración, así
 *    que las columnas siguen en las bases aunque el código ya no las usa. El
 *    generador las recoge aquí. Se pierde su contenido: un punto focal de un
 *    VÍDEO nunca se usó en ninguna plantilla (el póster es una imagen de
 *    `Media`, con su propio punto focal), así que no hay dato que conservar.
 *    Vídeos al aplicarla (2026-09-24): preview 0 (contado DESPUÉS de migrar,
 *    por la API) y producción 0 (contado ANTES de fusionar). Nada que perder.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_usada_imagen_id" integer;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_imagen_id_media_id_fk" FOREIGN KEY ("seccion_usada_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_usada_seccion_usada_imagen_idx" ON "paginas" USING btree ("seccion_usada_imagen_id");
  ALTER TABLE "videos" DROP COLUMN "focal_x";
  ALTER TABLE "videos" DROP COLUMN "focal_y";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_imagen_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_usada_seccion_usada_imagen_idx";
  ALTER TABLE "videos" ADD COLUMN "focal_x" numeric;
  ALTER TABLE "videos" ADD COLUMN "focal_y" numeric;
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_imagen_id";`)
}
