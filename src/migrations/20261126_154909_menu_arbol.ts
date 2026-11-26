import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * EL ÁRBOL DEL MENÚ PRINCIPAL (tanda 25, tarea 2; Juan Pablo, 2026-11-26).
 *
 * Todo el menú pasa a «Enlaces del menú» del global `cabecera`: cada fila de la barra gana su
 * «Tipo» (enlace simple o desplegable) y, anidados, los apartados de su desplegable
 * (`cabecera_enlaces_apartados`: lista automática con su fuente, enlace fijo o grupo) y los
 * enlaces de cada grupo (`cabecera_enlaces_apartados_enlaces`).
 *
 * LA SIEMBRA COPIA EL MENÚ DE HOY TAL CUAL, para que lo publicado no cambie al fusionar. Hasta
 * ahora, la fila de la barra que lleva a la portada de maquinaria, a la de repuestos o a la de
 * lubricantes (la general o la de una marca con página propia) abría el desplegable de su
 * sección, con los apartados de las tres listas de la tanda 24 (`cabecera_menu_*`). Para cada
 * una de esas filas (su dirección, sin `?` ni `#` y con la barra final):
 *   1. pasa a «Desplegable»; las demás se quedan en «Enlace simple» (el valor por defecto);
 *   2. recibe, en el mismo orden y con el mismo nombre y «Mostrar», las filas de su lista de la
 *      tanda 24: cada tipo automático, como lista con su fuente; cada enlace fijo, tal cual
 *      (la política de garantías entre ellos);
 *   3. si esa lista está vacía, recibe el menú de siempre (el mismo que pinta el código,
 *      `APARTADOS_POR_DEFECTO`; lo compara `arbol.test.ts`).
 * Las tres listas de la tanda 24 NO se borran: se quedan, ocultas en el panel, hasta la limpieza.
 * SQL explícito, sin la API local ni nada de `src/` (CLAUDE.md §3.5). Sin filas en
 * `cabecera_enlaces` (una base vacía) no se siembra nada.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cabecera_enlaces_apartados_tipo" AS ENUM('lista', 'enlace', 'grupo');
  CREATE TYPE "public"."enum_cabecera_enlaces_apartados_fuente" AS ENUM('pagina-maquinaria', 'nueva', 'nueva-marcas', 'nueva-tipos', 'usada', 'aditamentos', 'pagina-repuestos', 'repuestos-marcas', 'categorias-tecnicas', 'pagina-lubricantes', 'lubricantes-marcas');
  CREATE TYPE "public"."enum_cabecera_enlaces_tipo" AS ENUM('enlace', 'desplegable');
  CREATE TABLE "cabecera_enlaces_apartados_enlaces" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mostrar" boolean DEFAULT true,
  	"etiqueta" varchar,
  	"enlace" varchar
  );
  
  CREATE TABLE "cabecera_enlaces_apartados" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mostrar" boolean DEFAULT true,
  	"nombre" varchar,
  	"tipo" "enum_cabecera_enlaces_apartados_tipo" DEFAULT 'enlace',
  	"fuente" "enum_cabecera_enlaces_apartados_fuente",
  	"enlace" varchar
  );
  
  ALTER TABLE "cabecera_enlaces" ADD COLUMN "tipo" "enum_cabecera_enlaces_tipo" DEFAULT 'enlace' NOT NULL;
  ALTER TABLE "cabecera_enlaces_apartados_enlaces" ADD CONSTRAINT "cabecera_enlaces_apartados_enlaces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cabecera_enlaces_apartados"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cabecera_enlaces_apartados" ADD CONSTRAINT "cabecera_enlaces_apartados_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cabecera_enlaces"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cabecera_enlaces_apartados_enlaces_order_idx" ON "cabecera_enlaces_apartados_enlaces" USING btree ("_order");
  CREATE INDEX "cabecera_enlaces_apartados_enlaces_parent_id_idx" ON "cabecera_enlaces_apartados_enlaces" USING btree ("_parent_id");
  CREATE INDEX "cabecera_enlaces_apartados_order_idx" ON "cabecera_enlaces_apartados" USING btree ("_order");
  CREATE INDEX "cabecera_enlaces_apartados_parent_id_idx" ON "cabecera_enlaces_apartados" USING btree ("_parent_id");

  UPDATE "cabecera_enlaces" e SET "tipo" = 'desplegable'
  WHERE rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/maquinaria-pesada/';

  INSERT INTO "cabecera_enlaces_apartados" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "fuente", "enlace")
  SELECT
    a."_order",
    e."id",
    '6926154909a' || substr(md5(e."id" || '-' || a."id"), 1, 13),
    a."mostrar",
    a."nombre",
    (CASE WHEN a."tipo"::text = 'enlace' THEN 'enlace' ELSE 'lista' END)::"enum_cabecera_enlaces_apartados_tipo",
    (CASE a."tipo"::text WHEN 'ver-todo' THEN 'pagina-maquinaria' WHEN 'nueva' THEN 'nueva' WHEN 'usada' THEN 'usada' WHEN 'aditamentos' THEN 'aditamentos' END)::"enum_cabecera_enlaces_apartados_fuente",
    CASE WHEN a."tipo"::text = 'enlace' THEN a."enlace" END
  FROM "cabecera_enlaces" e
  JOIN "cabecera_menu_maquinaria" a ON a."_parent_id" = e."_parent_id"
  WHERE rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/maquinaria-pesada/';

  INSERT INTO "cabecera_enlaces_apartados" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "fuente", "enlace")
  SELECT
    v.orden,
    e."id",
    '6926154909a' || substr(md5(e."id" || '-' || v.orden::text), 1, 13),
    true,
    v.nombre,
    v.tipo::"enum_cabecera_enlaces_apartados_tipo",
    v.fuente::"enum_cabecera_enlaces_apartados_fuente",
    v.enlace
  FROM "cabecera_enlaces" e
  CROSS JOIN (VALUES
    (1, 'Ver toda la maquinaria pesada', 'lista', 'pagina-maquinaria', NULL),
    (2, 'Maquinaria pesada nueva', 'lista', 'nueva', NULL),
    (3, 'Maquinaria pesada usada', 'lista', 'usada', NULL),
    (4, 'Aditamentos para maquinaria pesada', 'lista', 'aditamentos', NULL)
  ) AS v(orden, nombre, tipo, fuente, enlace)
  WHERE rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/maquinaria-pesada/'
    AND NOT EXISTS (SELECT 1 FROM "cabecera_menu_maquinaria" a WHERE a."_parent_id" = e."_parent_id");

  UPDATE "cabecera_enlaces" e SET "tipo" = 'desplegable'
  WHERE rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/repuestos-maquinaria-pesada-colombia/';

  INSERT INTO "cabecera_enlaces_apartados" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "fuente", "enlace")
  SELECT
    a."_order",
    e."id",
    '6926154909b' || substr(md5(e."id" || '-' || a."id"), 1, 13),
    a."mostrar",
    a."nombre",
    (CASE WHEN a."tipo"::text = 'enlace' THEN 'enlace' ELSE 'lista' END)::"enum_cabecera_enlaces_apartados_tipo",
    (CASE a."tipo"::text WHEN 'ver-todo' THEN 'pagina-repuestos' WHEN 'marcas' THEN 'repuestos-marcas' WHEN 'categorias' THEN 'categorias-tecnicas' END)::"enum_cabecera_enlaces_apartados_fuente",
    CASE WHEN a."tipo"::text = 'enlace' THEN a."enlace" END
  FROM "cabecera_enlaces" e
  JOIN "cabecera_menu_repuestos" a ON a."_parent_id" = e."_parent_id"
  WHERE rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/repuestos-maquinaria-pesada-colombia/';

  INSERT INTO "cabecera_enlaces_apartados" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "fuente", "enlace")
  SELECT
    v.orden,
    e."id",
    '6926154909b' || substr(md5(e."id" || '-' || v.orden::text), 1, 13),
    true,
    v.nombre,
    v.tipo::"enum_cabecera_enlaces_apartados_tipo",
    v.fuente::"enum_cabecera_enlaces_apartados_fuente",
    v.enlace
  FROM "cabecera_enlaces" e
  CROSS JOIN (VALUES
    (1, 'Ver todos los repuestos', 'lista', 'pagina-repuestos', NULL),
    (2, 'Repuestos por marca', 'lista', 'repuestos-marcas', NULL),
    (3, 'Repuestos por categoría técnica', 'lista', 'categorias-tecnicas', NULL),
    (4, 'Política de garantías y repuestos', 'enlace', NULL, '/politica-de-garantia-de-repuestos/')
  ) AS v(orden, nombre, tipo, fuente, enlace)
  WHERE rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/repuestos-maquinaria-pesada-colombia/'
    AND NOT EXISTS (SELECT 1 FROM "cabecera_menu_repuestos" a WHERE a."_parent_id" = e."_parent_id");

  UPDATE "cabecera_enlaces" e SET "tipo" = 'desplegable'
  WHERE (rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/lubricantes/'
      OR rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' IN (
        SELECT '/lubricantes/' || m."slug" || '/' FROM "marcas_lubricante" m
        WHERE m."destino" IS DISTINCT FROM 'externo'
      ));

  INSERT INTO "cabecera_enlaces_apartados" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "fuente", "enlace")
  SELECT
    a."_order",
    e."id",
    '6926154909c' || substr(md5(e."id" || '-' || a."id"), 1, 13),
    a."mostrar",
    a."nombre",
    (CASE WHEN a."tipo"::text = 'enlace' THEN 'enlace' ELSE 'lista' END)::"enum_cabecera_enlaces_apartados_tipo",
    (CASE a."tipo"::text WHEN 'ver-todo' THEN 'pagina-lubricantes' WHEN 'marcas' THEN 'lubricantes-marcas' END)::"enum_cabecera_enlaces_apartados_fuente",
    CASE WHEN a."tipo"::text = 'enlace' THEN a."enlace" END
  FROM "cabecera_enlaces" e
  JOIN "cabecera_menu_lubricantes" a ON a."_parent_id" = e."_parent_id"
  WHERE (rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/lubricantes/'
      OR rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' IN (
        SELECT '/lubricantes/' || m."slug" || '/' FROM "marcas_lubricante" m
        WHERE m."destino" IS DISTINCT FROM 'externo'
      ));

  INSERT INTO "cabecera_enlaces_apartados" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "fuente", "enlace")
  SELECT
    v.orden,
    e."id",
    '6926154909c' || substr(md5(e."id" || '-' || v.orden::text), 1, 13),
    true,
    v.nombre,
    v.tipo::"enum_cabecera_enlaces_apartados_tipo",
    v.fuente::"enum_cabecera_enlaces_apartados_fuente",
    v.enlace
  FROM "cabecera_enlaces" e
  CROSS JOIN (VALUES
    (1, 'Ver todos los lubricantes', 'lista', 'pagina-lubricantes', NULL),
    (2, 'Marcas de lubricantes', 'lista', 'lubricantes-marcas', NULL)
  ) AS v(orden, nombre, tipo, fuente, enlace)
  WHERE (rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' = '/lubricantes/'
      OR rtrim(split_part(split_part(btrim(COALESCE(e."enlace", '')), '?', 1), '#', 1), '/') || '/' IN (
        SELECT '/lubricantes/' || m."slug" || '/' FROM "marcas_lubricante" m
        WHERE m."destino" IS DISTINCT FROM 'externo'
      ))
    AND NOT EXISTS (SELECT 1 FROM "cabecera_menu_lubricantes" a WHERE a."_parent_id" = e."_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cabecera_enlaces_apartados_enlaces" CASCADE;
  DROP TABLE "cabecera_enlaces_apartados" CASCADE;
  ALTER TABLE "cabecera_enlaces" DROP COLUMN "tipo";
  DROP TYPE "public"."enum_cabecera_enlaces_apartados_tipo";
  DROP TYPE "public"."enum_cabecera_enlaces_apartados_fuente";
  DROP TYPE "public"."enum_cabecera_enlaces_tipo";`)
}
