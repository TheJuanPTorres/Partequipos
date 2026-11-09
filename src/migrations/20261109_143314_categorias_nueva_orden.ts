import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Orden arrastrando de «Categorías de maquinaria nueva» (`orderable`, dirección 2026-11-09): la
 * columna `_order` de Payload (fractional indexing, base 36 en minúsculas) y, como ORDEN INICIAL,
 * el de hoy: la lista de la web antigua (`ORDEN_TIPOS_NUEVA`, copiada aquí a mano, §3.5) por el
 * comienzo del nombre, sin tildes, mayúsculas ni el «vibro» de «Vibrocompactador»; los que no
 * están, detrás; empates, por nombre. Claves `a0`…`az` y, de la 37 en adelante, `b00`, `b01`…,
 * las mismas que genera Payload.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_maquinaria" ADD COLUMN "_order" varchar;
  CREATE INDEX "categorias_maquinaria__order_idx" ON "categorias_maquinaria" USING btree ("_order");`)
  await db.execute(sql`
  WITH normalizadas AS (
    SELECT
      id,
      regexp_replace(
        lower(trim(translate(nombre, 'áéíóúÁÉÍÓÚüÜñÑ', 'aeiouAEIOUuUnN'))),
        '^vibrocompactador',
        'compactador'
      ) AS n
    FROM "categorias_maquinaria"
  ),
  puestos AS (
    SELECT
      id,
      n,
      CASE
        WHEN n LIKE 'bulldozer%' THEN 0
        WHEN n LIKE 'excavador%' THEN 1
        WHEN n LIKE 'motoniveladora%' THEN 2
        WHEN n LIKE 'miniexcavador%' THEN 3
        WHEN n LIKE 'minicargador%' THEN 4
        WHEN n LIKE 'retrocargador%' THEN 5
        WHEN n LIKE 'compactador%' THEN 6
        WHEN n LIKE 'pavimentador%' THEN 7
        WHEN n LIKE 'cargador%' THEN 8
        ELSE 9
      END AS puesto
    FROM normalizadas
  ),
  numeradas AS (
    SELECT id, (row_number() OVER (ORDER BY puesto, n, id))::int AS i FROM puestos
  )
  UPDATE "categorias_maquinaria" AS c
  SET "_order" = CASE
    WHEN numeradas.i <= 36
      THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', numeradas.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (numeradas.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (numeradas.i - 37) % 36 + 1, 1)
  END
  FROM numeradas
  WHERE numeradas.id = c.id;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "categorias_maquinaria__order_idx";
  ALTER TABLE "categorias_maquinaria" DROP COLUMN IF EXISTS "_order";`)
}
