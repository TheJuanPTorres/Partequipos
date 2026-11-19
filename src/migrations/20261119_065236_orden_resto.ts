import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * ORDEN POR ARRASTRE DEL RESTO (2026-11-19, dirección; informe del panel §6; repuestos ya en
 * `20261119_061503_orden_repuestos`). Columnas de `orderable` de Payload:
 *
 * - colección: marcas de maquinaria, categorías y marcas de usada, marcas de lubricante, sedes,
 *   testimonios y preguntas frecuentes (`_order`);
 * - joins ordenables: tipos de una marca de maquinaria (`tipos_maquinaria._tipos_maquinaria_tipos_order`),
 *   equipos de un tipo (`equipos_nuevos._equipos_nuevos_equipos_order`) y líneas de una marca de
 *   lubricante (`categorias_lubricante._categorias_lubricante_lineas_order`), con el orden POR PADRE.
 *
 * ORDEN INICIAL = el que pinta hoy la web: donde hay «Orden» (`orden`), por él (vacíos al final)
 * y nombre, como `sort: ["orden", "nombre"]`; si no, por nombre. Empates, por id. Claves de
 * Payload (`a0`…`az`, `b00`…). SQL explícito, sin la API local (§3.5).
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_nuevos" ADD COLUMN "_equipos_nuevos_equipos_order" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "_order" varchar;
  ALTER TABLE "tipos_maquinaria" ADD COLUMN "_tipos_maquinaria_tipos_order" varchar;
  ALTER TABLE "categorias_usada" ADD COLUMN "_order" varchar;
  ALTER TABLE "marcas_usada" ADD COLUMN "_order" varchar;
  ALTER TABLE "marcas_lubricante" ADD COLUMN "_order" varchar;
  ALTER TABLE "categorias_lubricante" ADD COLUMN "_categorias_lubricante_lineas_order" varchar;
  ALTER TABLE "preguntas_frecuentes" ADD COLUMN "_order" varchar;
  ALTER TABLE "testimonios" ADD COLUMN "_order" varchar;
  ALTER TABLE "sedes" ADD COLUMN "_order" varchar;
  CREATE INDEX "equipos_nuevos__equipos_nuevos_equipos_order_idx" ON "equipos_nuevos" USING btree ("_equipos_nuevos_equipos_order");
  CREATE INDEX "marcas_maquinaria__order_idx" ON "marcas_maquinaria" USING btree ("_order");
  CREATE INDEX "tipos_maquinaria__tipos_maquinaria_tipos_order_idx" ON "tipos_maquinaria" USING btree ("_tipos_maquinaria_tipos_order");
  CREATE INDEX "categorias_usada__order_idx" ON "categorias_usada" USING btree ("_order");
  CREATE INDEX "marcas_usada__order_idx" ON "marcas_usada" USING btree ("_order");
  CREATE INDEX "marcas_lubricante__order_idx" ON "marcas_lubricante" USING btree ("_order");
  CREATE INDEX "categorias_lubricante__categorias_lubricante_lineas_orde_idx" ON "categorias_lubricante" USING btree ("_categorias_lubricante_lineas_order");
  CREATE INDEX "preguntas_frecuentes__order_idx" ON "preguntas_frecuentes" USING btree ("_order");
  CREATE INDEX "testimonios__order_idx" ON "testimonios" USING btree ("_order");
  CREATE INDEX "sedes__order_idx" ON "sedes" USING btree ("_order");`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "nombre", id))::int AS i FROM "marcas_maquinaria")
  UPDATE "marcas_maquinaria" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "orden" NULLS LAST, "nombre", id))::int AS i FROM "categorias_usada")
  UPDATE "categorias_usada" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "nombre", id))::int AS i FROM "marcas_usada")
  UPDATE "marcas_usada" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "nombre", id))::int AS i FROM "marcas_lubricante")
  UPDATE "marcas_lubricante" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "orden" NULLS LAST, id))::int AS i FROM "sedes")
  UPDATE "sedes" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "orden" NULLS LAST, id))::int AS i FROM "testimonios")
  UPDATE "testimonios" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (ORDER BY "orden" NULLS LAST, id))::int AS i FROM "preguntas_frecuentes")
  UPDATE "preguntas_frecuentes" AS t SET "_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (PARTITION BY "marca_id" ORDER BY "orden" NULLS LAST, "nombre", id))::int AS i FROM "tipos_maquinaria")
  UPDATE "tipos_maquinaria" AS t SET "_tipos_maquinaria_tipos_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (PARTITION BY "tipo_id" ORDER BY "orden" NULLS LAST, "nombre", id))::int AS i FROM "equipos_nuevos")
  UPDATE "equipos_nuevos" AS t SET "_equipos_nuevos_equipos_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
  await db.execute(sql`
  WITH n AS (SELECT id, (row_number() OVER (PARTITION BY "marca_id" ORDER BY "orden" NULLS LAST, "nombre", id))::int AS i FROM "categorias_lubricante")
  UPDATE "categorias_lubricante" AS t SET "_categorias_lubricante_lineas_order" = CASE
    WHEN n.i <= 36 THEN 'a' || substr('0123456789abcdefghijklmnopqrstuvwxyz', n.i, 1)
    ELSE 'b'
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) / 36 + 1, 1)
      || substr('0123456789abcdefghijklmnopqrstuvwxyz', (n.i - 37) % 36 + 1, 1)
  END
  FROM n WHERE n.id = t.id;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "equipos_nuevos__equipos_nuevos_equipos_order_idx";
  DROP INDEX IF EXISTS "marcas_maquinaria__order_idx";
  DROP INDEX IF EXISTS "tipos_maquinaria__tipos_maquinaria_tipos_order_idx";
  DROP INDEX IF EXISTS "categorias_usada__order_idx";
  DROP INDEX IF EXISTS "marcas_usada__order_idx";
  DROP INDEX IF EXISTS "marcas_lubricante__order_idx";
  DROP INDEX IF EXISTS "categorias_lubricante__categorias_lubricante_lineas_orde_idx";
  DROP INDEX IF EXISTS "preguntas_frecuentes__order_idx";
  DROP INDEX IF EXISTS "testimonios__order_idx";
  DROP INDEX IF EXISTS "sedes__order_idx";
  ALTER TABLE "equipos_nuevos" DROP COLUMN IF EXISTS "_equipos_nuevos_equipos_order";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "tipos_maquinaria" DROP COLUMN IF EXISTS "_tipos_maquinaria_tipos_order";
  ALTER TABLE "categorias_usada" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "marcas_usada" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "marcas_lubricante" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "categorias_lubricante" DROP COLUMN IF EXISTS "_categorias_lubricante_lineas_order";
  ALTER TABLE "preguntas_frecuentes" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "testimonios" DROP COLUMN IF EXISTS "_order";
  ALTER TABLE "sedes" DROP COLUMN IF EXISTS "_order";`)
}
