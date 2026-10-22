import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * LÍNEAS DE LUBRICANTE CON PÁGINA PROPIA (2026-10-22, dirección; plantilla de Andrés 4039).
 *
 * 1. Esquema: «Orden» e «Imagen de cabecera» en las categorías de lubricante.
 * 2. Datos (SQL explícito, CLAUDE.md §3.5):
 *    - el orden de las 4 líneas de ENI, como la plantilla: Motos y Scooters, Auto liviano,
 *      Auto pesado y Engranajes;
 *    - FUERA los 4 301 de las URL de las líneas a su ancla (`#auto-liviano`…), que se
 *      pusieron el 2026-10-14 cuando las líneas eran secciones de la página de la marca. Con
 *      las páginas de vuelta en esas URL, el 301 las taparía, y el ancla, que ahora lleva a
 *      la página, haría un bucle. Solo se borran si siguen apuntando a su ancla.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_lubricante" ADD COLUMN "orden" numeric;
  ALTER TABLE "categorias_lubricante" ADD COLUMN "imagen_cabecera_id" integer;
  ALTER TABLE "categorias_lubricante" ADD CONSTRAINT "categorias_lubricante_imagen_cabecera_id_media_id_fk" FOREIGN KEY ("imagen_cabecera_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_lubricante_imagen_cabecera_idx" ON "categorias_lubricante" USING btree ("imagen_cabecera_id");`)

  await db.execute(sql`
  UPDATE "categorias_lubricante" AS c
     SET "orden" = v.orden
    FROM (VALUES ('motos-scooter', 1), ('auto-liviano', 2), ('auto-pesado', 3), ('engranajes', 4)) AS v(slug, orden),
         "marcas_lubricante" AS m
   WHERE c."marca_id" = m."id" AND m."slug" = 'lubricantes-eni' AND c."slug" = v.slug;

  DELETE FROM "redirects"
   WHERE "desde" IN (
           '/lubricantes/lubricantes-eni/auto-liviano',
           '/lubricantes/lubricantes-eni/auto-pesado',
           '/lubricantes/lubricantes-eni/engranajes',
           '/lubricantes/lubricantes-eni/motos-scooter'
         )
     AND "hacia" = '/lubricantes/lubricantes-eni#' || substring("desde" from '[^/]+$');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Vuelven los 301 a las anclas, como los dejó el 2026-10-14 (si no hay ya una fila con ese origen).
  await db.execute(sql`
  INSERT INTO "redirects" ("desde", "hacia", "tipo", "origen")
  SELECT v.desde, '/lubricantes/lubricantes-eni#' || v.ancla, '301', 'migracion'
    FROM (VALUES
           ('/lubricantes/lubricantes-eni/auto-liviano', 'auto-liviano'),
           ('/lubricantes/lubricantes-eni/auto-pesado', 'auto-pesado'),
           ('/lubricantes/lubricantes-eni/engranajes', 'engranajes'),
           ('/lubricantes/lubricantes-eni/motos-scooter', 'motos-scooter')
         ) AS v(desde, ancla)
   WHERE NOT EXISTS (SELECT 1 FROM "redirects" r WHERE r."desde" = v.desde);`)

  await db.execute(sql`
   ALTER TABLE "categorias_lubricante" DROP CONSTRAINT "categorias_lubricante_imagen_cabecera_id_media_id_fk";

  DROP INDEX "categorias_lubricante_imagen_cabecera_idx";
  ALTER TABLE "categorias_lubricante" DROP COLUMN "orden";
  ALTER TABLE "categorias_lubricante" DROP COLUMN "imagen_cabecera_id";`)
}
