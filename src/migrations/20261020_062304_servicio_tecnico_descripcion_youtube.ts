import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * «Descripción del vídeo de YouTube» del bloque «Vídeo de YouTube» (diseño «Servicio
 * técnico», dirección, 2026-10-20). Solo esquema: el texto lo pone
 * `scripts/servicio-lubricantes/ajustes-servicio-tecnico.ts` (runbook en el sitio publicado).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_blocks_video_youtube" ADD COLUMN "descripcion_youtube" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_blocks_video_youtube" DROP COLUMN "descripcion_youtube";`)
}
