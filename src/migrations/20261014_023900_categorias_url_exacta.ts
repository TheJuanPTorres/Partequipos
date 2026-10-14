import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * MIGRACIÓN DE DATOS, SIN ESQUEMA (CLAUDE.md §3.5: SQL explícito, nunca la API
 * local). Las páginas de categoría técnica de repuestos (provisionales hasta el
 * diseño de Andrés) viven en la URL EXACTA del sitio actual:
 *
 *   /repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/<slug>/
 *
 * Esos slugs (docs/url-map.csv) llevan el sufijo «-para-maquinaria-pesada»; los
 * de las 10 categorías sembradas no. Se renombran aquí, por su slug anterior
 * exacto (las que no coincidan, no se tocan, y repetir la migración no hace nada).
 *
 * El de motor diésel es el del sitio VIVO (motor-diesel-para-maquinaria-pesada,
 * 200 en el rastreo) y no el del mapa de alcance (repuestos-motor-diesel-...,
 * que no existe): la jerarquía existente es intocable (§3.3). Dirección decide si cambia.
 *
 * Estas URL daban 404 hasta hoy, así que no hay redirección que crear.
 *
 * Además se siembra el «Enlace de la tarjeta» (campo `enlace`) de las categorías
 * que no lo tenían, para que las tarjetas de la portada enlacen a su página.
 */
const NUEVOS = [
  ['tren-de-rodaje', 'tren-de-rodaje-para-maquinaria-pesada'],
  ['filtracion', 'filtracion-para-maquinaria-pesada'],
  ['herramienta-de-corte-gets', 'herramienta-de-corte-gets-para-maquinaria-pesada'],
  ['lubricantes', 'lubricantes-para-maquinaria-pesada'],
  ['miscelaneos', 'miscelaneos-para-maquinaria-pesada'],
  ['componentes-mayores', 'componentes-mayores-para-maquinaria-pesada'],
  ['repuestos-motor-diesel', 'motor-diesel-para-maquinaria-pesada'],
  ['transmision', 'transmision-para-maquinaria-pesada'],
  ['componentes-hidraulicos', 'componentes-hidraulicos-para-maquinaria-pesada'],
  ['llantas-y-rines', 'llantas-y-rines-para-maquinaria-pesada'],
] as const

const BASE = '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [viejo, nuevo] of NUEVOS) {
    await db.execute(sql`
      UPDATE "categorias_tecnicas" SET "slug" = ${nuevo}
      WHERE "slug" = ${viejo}
        AND NOT EXISTS (SELECT 1 FROM "categorias_tecnicas" WHERE "slug" = ${nuevo});`)
  }
  // El enlace de la tarjeta, solo donde estaba vacío y solo en las ya renombradas.
  for (const [, nuevo] of NUEVOS) {
    await db.execute(sql`
      UPDATE "categorias_tecnicas" SET "enlace" = ${BASE + nuevo + '/'}
      WHERE "slug" = ${nuevo} AND ("enlace" IS NULL OR "enlace" = '');`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Solo se deshace el renombrado; el enlace sembrado se deja (es inocuo y editable).
  for (const [viejo, nuevo] of NUEVOS) {
    await db.execute(sql`
      UPDATE "categorias_tecnicas" SET "slug" = ${viejo}
      WHERE "slug" = ${nuevo}
        AND NOT EXISTS (SELECT 1 FROM "categorias_tecnicas" WHERE "slug" = ${viejo});`)
  }
}
