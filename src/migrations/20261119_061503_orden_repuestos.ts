import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ORDEN POR ARRASTRE DE REPUESTOS (2026-11-19, dirección; informe del panel §6). Las columnas de
 * `orderable` de Payload (fractional indexing, base 36 en minúsculas):
 *
 * - `marcas._order` y `categorias_tecnicas._order`: orden de la colección;
 * - `tipos_equipo._tipos_equipo_tipos_order`: el join «Tipos» de la marca (orden POR MARCA);
 * - `modelos_repuesto._modelos_repuesto_modelos_order`: el join «Modelos» del tipo (POR TIPO).
 *
 * ORDEN INICIAL = el que pinta hoy la web, para que nada cambie al fusionar: marcas, tipos y
 * modelos por nombre (el `sort: "nombre"` de sus consultas, con la misma intercalación de la
 * base); categorías por «Posición en las páginas de repuestos» (`orden_marca`, vacíos al final) y
 * nombre. Empates, por id. Claves `a0`…`az` y desde la 37 `b00`, `b01`…, las de Payload (como
 * `20261109_143314_categorias_nueva_orden`). SQL explícito, sin la API local (§3.5).
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto" ADD COLUMN "_modelos_repuesto_modelos_order" varchar;
  ALTER TABLE "marcas" ADD COLUMN "_order" varchar;
  ALTER TABLE "tipos_equipo" ADD COLUMN "_tipos_equipo_tipos_order" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "_order" varchar;
  CREATE INDEX "modelos_repuesto__modelos_repuesto_modelos_order_idx" ON "modelos_repuesto" USING btree ("_modelos_repuesto_modelos_order");
  CREATE INDEX "marcas__order_idx" ON "marcas" USING btree ("_order");
  CREATE INDEX "tipos_equipo__tipos_equipo_tipos_order_idx" ON "tipos_equipo" USING btree ("_tipos_equipo_tipos_order");
  CREATE INDEX "categorias_tecnicas__order_idx" ON "categorias_tecnicas" USING btree ("_order");`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "nombre", id))::int AS i FROM "marcas")
  UPDATE "marcas" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (PARTITION BY "marca_id" ORDER BY "nombre", id))::int AS i FROM "tipos_equipo")
  UPDATE "tipos_equipo" AS t SET "_tipos_equipo_tipos_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (PARTITION BY "tipo_id" ORDER BY "nombre", id))::int AS i FROM "modelos_repuesto")
  UPDATE "modelos_repuesto" AS t SET "_modelos_repuesto_modelos_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "orden_marca" NULLS LAST, "nombre", id))::int AS i FROM "categorias_tecnicas")
  UPDATE "categorias_tecnicas" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "modelos_repuesto__modelos_repuesto_modelos_order_idx";
  DROP INDEX IF EXISTS "marcas__order_idx";
  DROP INDEX IF EXISTS "tipos_equipo__tipos_equipo_tipos_order_idx";
  DROP INDEX IF EXISTS "categorias_tecnicas__order_idx";
  ALTER TABLE "modelos_repuesto" DROP COLUMN IF EXISTS "_modelos_repuesto_modelos_order";
  ALTER TABLE "marcas" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "tipos_equipo" DROP COLUMN IF EXISTS "_tipos_equipo_tipos_order";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN IF EXISTS "_order";`)
}
