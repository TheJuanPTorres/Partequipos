/*
 * Fase F de la portada (docs/diseno/decisiones-home-ux9.md §19): el vídeo y
 * el YouTube de la sección 7. Dos columnas NULLABLE y sin valor por defecto:
 * la portada existente queda «sin vídeo y sin YouTube», que es lo que ya
 * mostraba. Ningún dato cambia de significado (lección de §10.17). Solo SQL:
 * no usa la API local de Payload (§3.5).
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_compania_video_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_compania_youtube" varchar;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_compania_video_id_videos_id_fk" FOREIGN KEY ("seccion_compania_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_compania_seccion_compania_video_idx" ON "paginas" USING btree ("seccion_compania_video_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_compania_video_id_videos_id_fk";
  
  DROP INDEX "paginas_seccion_compania_seccion_compania_video_idx";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_video_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_youtube";`)
}
