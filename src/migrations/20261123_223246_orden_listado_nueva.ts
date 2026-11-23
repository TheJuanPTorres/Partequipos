import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ORDEN DE LOS LISTADOS DE NUEVA (2026-11-23, tanda 21, PR-2; dirección, opción (b)). Equipos nuevos
 * y tipos de maquinaria nueva pasan a ser `orderable` también como colección (`_order`): el listado
 * de nueva («Recomendados») y las pestañas de tipo mezclan marcas y tipos, y el orden de un join solo
 * vale entre hermanos. Solo AÑADE columnas.
 *
 * ORDEN INICIAL = el que pintaba la web, para que nada cambie al desplegar: equipos por id (el
 * «Recomendados» de antes) y tipos por nombre con la intercalación española (el `localeCompare("es")`
 * de antes; comprobado igual en el preview, 20 de 20). Claves de Payload (`a0`…`az`, `b00`…). SQL
 * explícito, sin la API local (§3.5).
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_nuevos" ADD COLUMN "_order" varchar;
  ALTER TABLE "tipos_maquinaria" ADD COLUMN "_order" varchar;
  CREATE INDEX "equipos_nuevos__order_idx" ON "equipos_nuevos" USING btree ("_order");
  CREATE INDEX "tipos_maquinaria__order_idx" ON "tipos_maquinaria" USING btree ("_order");`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY id))::int AS i FROM "equipos_nuevos")
  UPDATE "equipos_nuevos" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "nombre" COLLATE "es-x-icu", id))::int AS i FROM "tipos_maquinaria")
  UPDATE "tipos_maquinaria" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "equipos_nuevos__order_idx";
  DROP INDEX IF EXISTS "tipos_maquinaria__order_idx";
  ALTER TABLE "equipos_nuevos" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "tipos_maquinaria" DROP COLUMN IF EXISTS "_order";`)
}
