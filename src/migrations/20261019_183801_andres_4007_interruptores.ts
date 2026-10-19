import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Versión 4007 de la plantilla de Andrés para repuestos (2026-10-19, dirección):
 * - Interruptores «Provisional» (casilla desmarcada por defecto) del diseño propio de Lubricantes
 *   ENI (#260) y de «Qué incluye» (#237): en producción solo se publican plantillas de Andrés.
 * - Kobelco en turquesa (#04aca3, el del diseño) donde seguía con el azul estimado de la siembra
 *   (#0b4ea2): un color elegido por un editor no se toca.
 * - El subtítulo del contacto, como en el diseño: «Si deseas más información, contáctanos»
 *   (solo si seguía con el texto de WordPress).
 * SQL explícito (CLAUDE.md §3.5).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" ADD COLUMN "diseno_propio" boolean DEFAULT false;
  ALTER TABLE "repuestos_marca" ADD COLUMN "que_incluye_diseno_propio" boolean DEFAULT false;`)

  await db.execute(sql`
   UPDATE "marcas" SET "color_marca" = '#04aca3' WHERE lower("nombre") = 'kobelco' AND "color_marca" = '#0b4ea2';
  UPDATE "marcas_maquinaria" SET "color_marca" = '#04aca3' WHERE lower("nombre") = 'kobelco' AND "color_marca" = '#0b4ea2';
  UPDATE "repuestos_marca" SET "contacto_subtitulo" = 'Si deseas más información, contáctanos'
   WHERE "contacto_subtitulo" = 'Si deseas más info, contáctanos';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" DROP COLUMN "diseno_propio";
  ALTER TABLE "repuestos_marca" DROP COLUMN "que_incluye_diseno_propio";`)
}
