import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * MIGRACIÓN DE DATOS, SIN ESQUEMA (CLAUDE.md §3.5: SQL explícito, nunca la API
 * local ni imports de src/). 301 de las 21 URL heredadas de categoría de
 * repuestos del rastreo (docs/url-map.csv) a su categoría equivalente; los
 * subniveles (tren-de-rodaje-itr…), a su categoría madre. Decisión de dirección
 * del 2026-10-13, con las 21 filas aprobadas una a una.
 *
 * La lista es una COPIA LITERAL de src/lib/repuestos/categoriasHeredadas.ts:
 * una prueba (categoriasHeredadas.test.ts) exige que coincidan.
 *
 * IDEMPOTENTE: ON CONFLICT ("desde") DO NOTHING salta las que ya existan (por
 * ejemplo, una cargada a mano en el panel); repetir la migración no hace nada.
 * Las rutas se guardan como las normaliza la colección: sin barra final.
 * `estado_destino` queda «sin-verificar»: lo actualiza `npm run redirects:check`.
 *
 * El `down` borra SOLO las filas con ese desde, ese hacia y origen «migracion»
 * (las que sembró esta migración), no las editadas a mano.
 */
const REDIRECTS = [
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/aditamentos-para-maquinaria-pesada', '/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/baldes-y-protectores', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramienta-de-corte-gets-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/baldes-y-protectores/baldes-para-excavadoras', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramienta-de-corte-gets-para-maquinaria-pesada'],
  // Corregido el 2026-10-17 (auditoría de estructura): a motor diésel. Las bases
  // que ya tenían la migración se corrigen con el runbook de dirección.
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/baldes-y-protectores/motores-nuevo', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motor-diesel-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-electricos', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/miscelaneos-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-para-motores-diesel', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motor-diesel-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/elementos-de-ajuste', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/miscelaneos-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/empaquetaduras', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motor-diesel-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada/filtros-donaldson-maquinaria-pesada', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtros-maquinaria-pesada', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtros-maquinaria-pesada/filtros-fleetguard', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramientas-de-corte', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramienta-de-corte-gets-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas-y-rines-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas/llantas-otr', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/llantas-y-rines-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/mangueras-para-maquinaria-pesada', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/componentes-hidraulicos-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motores-diesel-completos', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/motor-diesel-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/productos', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/servicio-tecnico-para-maquinaria-pesada', '/servicio-tecnico'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje/tren-de-rodaje-cf', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje-para-maquinaria-pesada'],
  ['/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje/tren-de-rodaje-itr', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje-para-maquinaria-pesada'],
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [desde, hacia] of REDIRECTS) {
    await db.execute(sql`
      INSERT INTO "redirects" ("desde", "hacia", "tipo", "origen", "estado_destino", "updated_at", "created_at")
      VALUES (${desde}, ${hacia}, '301', 'migracion', 'sin-verificar', now(), now())
      ON CONFLICT ("desde") DO NOTHING;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [desde, hacia] of REDIRECTS) {
    await db.execute(sql`
      DELETE FROM "redirects"
      WHERE "desde" = ${desde} AND "hacia" = ${hacia} AND "origen" = 'migracion';`)
  }
}
