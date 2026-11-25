import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * «UN SOLO ORDEN» EN LA PORTADA (tanda 24, tarea 3; Juan Pablo, 2026-11-25).
 *
 * Las categorías técnicas de «Venta de repuestos» dejan de ordenarse con «Posición en la
 * portada» (`orden_portada`) y siguen el orden por arrastre de toda la web (`_order`). Qué
 * categorías salen lo decide ahora la casilla «En la portada» (`en_portada`).
 *
 * La siembra marca la casilla en las que HOY tienen posición: al publicar, la portada saca las
 * mismas categorías (el orden puede cambiar: es lo que se quiere). SQL explícito, sin la API
 * local (CLAUDE.md §3.5). `orden_portada` se queda (oculto en el panel) hasta su borrado en la
 * limpieza (PR 11), así que el `down` no pierde nada.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" ADD COLUMN "en_portada" boolean DEFAULT false;
   UPDATE "categorias_tecnicas" SET "en_portada" = true WHERE "orden_portada" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" DROP COLUMN "en_portada";`)
}
