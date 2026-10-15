import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * MIGRACIÓN DE DATOS, SIN ESQUEMA (CLAUDE.md §3.5: SQL explícito, nunca la API
 * local ni imports de src/). Dos decisiones de dirección del 2026-10-14, tras la
 * comprobación URL por URL del sitio publicado:
 *
 * 1. 301 de 17 URL huérfanas del rastreo que daban 404 (la 18.ª,
 *    /maquinaria-pesada/test, se queda en 404). Copia literal de
 *    src/lib/redirects/huerfanas.ts (huerfanas.test.ts exige que coincidan).
 *    IDEMPOTENTE: ON CONFLICT ("desde") DO NOTHING salta las que ya existan.
 *    Rutas sin barra final, como las normaliza la colección; `estado_destino`
 *    queda «sin-verificar» (lo actualiza `npm run redirects:check`).
 *
 * 2. Las descripciones que conservan el texto de la siembra de demostración
 *    («Contenido de demostracion.», y la nota interna del SV208) pasan al texto
 *    real de WordPress o se vacían. Copia literal de
 *    src/lib/datos/textosDemostracion.ts (textosDemostracion.test.ts). Solo
 *    cambia la fila si su descripción es EXACTAMENTE la de demostración: no pisa
 *    lo que haya escrito un editor, y repetirla no hace nada.
 *
 * El `down` deshace solo lo que hizo el `up`: borra los redirects con ese desde,
 * ese hacia y origen «migracion», y devuelve el texto de demostración solo
 * donde la descripción sigue siendo la que puso el `up`.
 */
const REDIRECTS = [
  ['/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras-propuesta2025', '/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras'],
  ['/maquinaria-pesada/maquinaria-pesada-usada/excavadoras4', '/maquinaria-pesada/maquinaria-pesada-usada/excavadoras'],
  ['/maquinaria-pesada/maquinaria-pesada-usada-otros', '/maquinaria-pesada/maquinaria-pesada-usada'],
  ['/blog-partequipos', '/noticias'],
  ['/lubricantes-eni', '/lubricantes/lubricantes-eni'],
  ['/inicio2025', '/'],
  ['/repuestos-para-maquinaria-pesada', '/repuestos-maquinaria-pesada-colombia'],
  ['/repuestos-para-maquinaria-pesada-2', '/repuestos-maquinaria-pesada-colombia'],
  ['/landing-dynapac', '/maquinaria-pesada/maquinaria-pesada-nueva/marcas/dynapac'],
  ['/lanzamiento_excavadoras', '/maquinaria-pesada/maquinaria-pesada-nueva/excavadoras'],
  ['/pe-partsshop', '/repuestos-maquinaria-pesada-colombia'],
  ['/openhouse', '/noticias'],
  ['/participa-openhouse', '/noticias'],
  ['/premios-open-house', '/noticias'],
  ['/referenciacion-openhouse-2025', '/noticias'],
  ['/congreso-de-alcaldes', '/noticias'],
  ['/competencia_nacional_de_operadores', '/noticias'],
] as const

// [tabla, slug, texto de demostración, texto nuevo (null: se vacía)]
const TEXTOS = [
  ['categorias_usada', 'bulldozer', 'Tractores de oruga de segunda mano, revisados antes de la entrega. Contenido de demostracion.', null],
  ['categorias_usada', 'cargadores', 'Cargadores frontales y minicargadores usados. Contenido de demostracion.', null],
  ['categorias_usada', 'compactadores', 'Rodillos y compactadores usados para suelo y asfalto. Contenido de demostracion.', null],
  ['categorias_usada', 'excavadoras', 'Excavadoras hidraulicas usadas de distintas marcas y tonelajes. Contenido de demostracion.', null],
  ['categorias_usada', 'minicargadores', 'Minicargadores de direccion deslizante usados. Contenido de demostracion.', null],
  ['categorias_usada', 'motoniveladoras', 'Motoniveladoras usadas para mantenimiento de via. Contenido de demostracion.', null],
  ['categorias_usada', 'retrocargadoras', 'Retrocargadoras usadas, la maquina mas versatil del inventario. Contenido de demostracion.', null],
  ['categorias_usada', 'vibrocompactadores', 'Vibrocompactadores usados de tambor liso y pata de cabra. Contenido de demostracion.', null],
  ['categorias_maquinaria', 'cargadores', 'Minicargadores y equipos de carga compacta de las marcas que distribuimos. Contenido de demostracion.', null],
  ['categorias_maquinaria', 'compactadores', 'Rodillos de suelo, de llantas y de doble rodillo para compactacion de base y asfalto. Contenido de demostracion.', null],
  ['categorias_maquinaria', 'excavadoras', 'Excavadoras hidraulicas y miniexcavadoras de las marcas que distribuimos. Contenido de demostracion.', null],
  ['marcas_maquinaria', 'aditamentos', 'Implementos y accesorios para adaptar la maquinaria a cada frente de obra: martillos, cucharones y acoples. Contenido de demostracion.', 'Potencia tu trabajo con nuestra solución líder en el mercado de Aditamentos para maquinaria pesada en Colombia.'],
  ['marcas_maquinaria', 'dynapac', 'Compactacion y pavimentacion: rodillos de suelo, de llantas, de doble rodillo, pavimentadoras y reglas vibratorias. Contenido de demostracion.', 'Descubre la nueva línea de equipos Dynapac con respaldo exclusivo de Partequipos Colombia.'],
  ['tipos_maquinaria', 'vibrocompactador-case-sv208', 'Rodillo vibratorio de suelo. Anomalia del sitio actual: este modelo cuelga al nivel de tipo, no de ficha. Se replica tal cual (ADR 0007).', 'El Vibrocompactador SV208 CASE combina potencia, alta fuerza centrífuga y visibilidad de 360 grados para alcanzar los más altos niveles de rendimiento. Con 99 hp (73,8 kW) de potencia, esta es una máquina de compactación altamente confiable, efectiva, de fácil mantenimiento y simple de manejar. Encuéntrala en Partequipos Colombia.'],
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [desde, hacia] of REDIRECTS) {
    await db.execute(sql`
      INSERT INTO "redirects" ("desde", "hacia", "tipo", "origen", "estado_destino", "updated_at", "created_at")
      VALUES (${desde}, ${hacia}, '301', 'migracion', 'sin-verificar', now(), now())
      ON CONFLICT ("desde") DO NOTHING;`)
  }
  for (const [tabla, slug, demo, nuevo] of TEXTOS) {
    await db.execute(sql`
      UPDATE ${sql.identifier(tabla)} SET "descripcion" = ${nuevo}, "updated_at" = now()
      WHERE "slug" = ${slug} AND "descripcion" = ${demo};`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [desde, hacia] of REDIRECTS) {
    await db.execute(sql`
      DELETE FROM "redirects"
      WHERE "desde" = ${desde} AND "hacia" = ${hacia} AND "origen" = 'migracion';`)
  }
  for (const [tabla, slug, demo, nuevo] of TEXTOS) {
    await db.execute(sql`
      UPDATE ${sql.identifier(tabla)} SET "descripcion" = ${demo}, "updated_at" = now()
      WHERE "slug" = ${slug} AND "descripcion" IS NOT DISTINCT FROM ${nuevo};`)
  }
}
