import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * APARTADOS DE LOS DESPLEGABLES DEL MENÚ PRINCIPAL (tanda 24, tarea 1; Juan Pablo, 2026-11-25).
 *
 * Tres listas ordenables en el global `cabecera`, una por desplegable (Maquinaria pesada,
 * Repuestos y Lubricantes): cada fila es un apartado con su nombre, su tipo (lista automática o
 * enlace fijo), su enlace y «Mostrar».
 *
 * LA SIEMBRA COPIA EL MENÚ DE HOY TAL CUAL, para que lo publicado no cambie al fusionar: los
 * mismos apartados, en el mismo orden y con los mismos nombres que estaban escritos en el código.
 * La política de garantías sale de sus columnas de `cabecera` (`politica_repuestos_*`, que se
 * quedan, ocultas en el panel, hasta su borrado en la limpieza): si hoy no se pinta (desmarcada,
 * o sin texto o sin enlace), su fila queda con «Mostrar» desmarcada y los valores de siempre.
 * SQL explícito, sin la API local ni nada de `src/` (CLAUDE.md §3.5). Sin fila en `cabecera`
 * (una base vacía) no se siembra nada, y el código pinta el menú de siempre.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cabecera_menu_maquinaria_tipo" AS ENUM('ver-todo', 'nueva', 'usada', 'aditamentos', 'enlace');
  CREATE TYPE "public"."enum_cabecera_menu_repuestos_tipo" AS ENUM('ver-todo', 'marcas', 'categorias', 'enlace');
  CREATE TYPE "public"."enum_cabecera_menu_lubricantes_tipo" AS ENUM('ver-todo', 'marcas', 'enlace');
  CREATE TABLE "cabecera_menu_maquinaria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mostrar" boolean DEFAULT true,
  	"nombre" varchar NOT NULL,
  	"tipo" "enum_cabecera_menu_maquinaria_tipo" DEFAULT 'enlace' NOT NULL,
  	"enlace" varchar
  );
  
  CREATE TABLE "cabecera_menu_repuestos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mostrar" boolean DEFAULT true,
  	"nombre" varchar NOT NULL,
  	"tipo" "enum_cabecera_menu_repuestos_tipo" DEFAULT 'enlace' NOT NULL,
  	"enlace" varchar
  );
  
  CREATE TABLE "cabecera_menu_lubricantes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"mostrar" boolean DEFAULT true,
  	"nombre" varchar NOT NULL,
  	"tipo" "enum_cabecera_menu_lubricantes_tipo" DEFAULT 'enlace' NOT NULL,
  	"enlace" varchar
  );
  
  ALTER TABLE "cabecera_menu_maquinaria" ADD CONSTRAINT "cabecera_menu_maquinaria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cabecera"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cabecera_menu_repuestos" ADD CONSTRAINT "cabecera_menu_repuestos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cabecera"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cabecera_menu_lubricantes" ADD CONSTRAINT "cabecera_menu_lubricantes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cabecera"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cabecera_menu_maquinaria_order_idx" ON "cabecera_menu_maquinaria" USING btree ("_order");
  CREATE INDEX "cabecera_menu_maquinaria_parent_id_idx" ON "cabecera_menu_maquinaria" USING btree ("_parent_id");
  CREATE INDEX "cabecera_menu_repuestos_order_idx" ON "cabecera_menu_repuestos" USING btree ("_order");
  CREATE INDEX "cabecera_menu_repuestos_parent_id_idx" ON "cabecera_menu_repuestos" USING btree ("_parent_id");
  CREATE INDEX "cabecera_menu_lubricantes_order_idx" ON "cabecera_menu_lubricantes" USING btree ("_order");
  CREATE INDEX "cabecera_menu_lubricantes_parent_id_idx" ON "cabecera_menu_lubricantes" USING btree ("_parent_id");

  INSERT INTO "cabecera_menu_maquinaria" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "enlace")
  SELECT v.orden, c."id", v.id, true, v.nombre, v.tipo::"enum_cabecera_menu_maquinaria_tipo", NULL
  FROM "cabecera" c
  CROSS JOIN (VALUES
    (1, '6926213752a0000000000001', 'Ver toda la maquinaria pesada', 'ver-todo'),
    (2, '6926213752a0000000000002', 'Maquinaria pesada nueva', 'nueva'),
    (3, '6926213752a0000000000003', 'Maquinaria pesada usada', 'usada'),
    (4, '6926213752a0000000000004', 'Aditamentos para maquinaria pesada', 'aditamentos')
  ) AS v(orden, id, nombre, tipo);

  INSERT INTO "cabecera_menu_repuestos" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "enlace")
  SELECT v.orden, c."id", v.id, true, v.nombre, v.tipo::"enum_cabecera_menu_repuestos_tipo", NULL
  FROM "cabecera" c
  CROSS JOIN (VALUES
    (1, '6926213752b0000000000001', 'Ver todos los repuestos', 'ver-todo'),
    (2, '6926213752b0000000000002', 'Repuestos por marca', 'marcas'),
    (3, '6926213752b0000000000003', 'Repuestos por categoría técnica', 'categorias')
  ) AS v(orden, id, nombre, tipo);

  INSERT INTO "cabecera_menu_repuestos" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "enlace")
  SELECT
    4,
    c."id",
    '6926213752b0000000000004',
    (c."politica_repuestos_mostrar" IS NOT FALSE
      AND NULLIF(btrim(c."politica_repuestos_texto"), '') IS NOT NULL
      AND NULLIF(btrim(c."politica_repuestos_enlace"), '') IS NOT NULL),
    COALESCE(NULLIF(btrim(c."politica_repuestos_texto"), ''), 'Política de garantías y repuestos'),
    'enlace',
    COALESCE(NULLIF(btrim(c."politica_repuestos_enlace"), ''), '/politica-de-garantia-de-repuestos/')
  FROM "cabecera" c;

  INSERT INTO "cabecera_menu_lubricantes" ("_order", "_parent_id", "id", "mostrar", "nombre", "tipo", "enlace")
  SELECT v.orden, c."id", v.id, true, v.nombre, v.tipo::"enum_cabecera_menu_lubricantes_tipo", NULL
  FROM "cabecera" c
  CROSS JOIN (VALUES
    (1, '6926213752c0000000000001', 'Ver todos los lubricantes', 'ver-todo'),
    (2, '6926213752c0000000000002', 'Marcas de lubricantes', 'marcas')
  ) AS v(orden, id, nombre, tipo);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cabecera_menu_maquinaria" CASCADE;
  DROP TABLE "cabecera_menu_repuestos" CASCADE;
  DROP TABLE "cabecera_menu_lubricantes" CASCADE;
  DROP TYPE "public"."enum_cabecera_menu_maquinaria_tipo";
  DROP TYPE "public"."enum_cabecera_menu_repuestos_tipo";
  DROP TYPE "public"."enum_cabecera_menu_lubricantes_tipo";`)
}
