import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_usados" ADD COLUMN "slug" varchar;
  ALTER TABLE "equipos_usados" ADD COLUMN "seo_meta_title" varchar;
  ALTER TABLE "equipos_usados" ADD COLUMN "seo_meta_description" varchar;
  ALTER TABLE "equipos_usados" ADD COLUMN "seo_og_image_id" integer;
  ALTER TABLE "equipos_usados" ADD CONSTRAINT "equipos_usados_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  -- Relleno con SQL explícito (CLAUDE.md §3.5): la dirección web de las unidades que ya
  -- existen sale de su nombre, como el gancho del panel (formatSlug): minúsculas, sin
  -- tildes, guiones. Si dos de la misma categoría dan lo mismo, la segunda y las
  -- siguientes llevan su id. «pagina» y «marcas» están reservadas.
  WITH base AS (
    SELECT "id", "categoria_id",
      trim(both '-' from regexp_replace(lower(translate("nombre",
        'áàäâéèëêíìïîóòöôúùüûñÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑ',
        'aaaaeeeeiiiioooouuuunaaaaeeeeiiiioooouuuun')), '[^a-z0-9]+', '-', 'g')) AS "b"
    FROM "equipos_usados"
  ), nombrada AS (
    SELECT "id", "categoria_id",
      CASE WHEN "b" = '' THEN 'unidad-' || "id"
           WHEN "b" IN ('pagina', 'marcas') THEN "b" || '-unidad'
           ELSE "b" END AS "b"
    FROM base
  ), numerada AS (
    SELECT "id", "b", row_number() OVER (PARTITION BY "categoria_id", "b" ORDER BY "id") AS "n"
    FROM nombrada
  )
  UPDATE "equipos_usados" e
    SET "slug" = CASE WHEN n."n" = 1 THEN n."b" ELSE n."b" || '-' || e."id" END
    FROM numerada n WHERE n."id" = e."id";
  CREATE INDEX "equipos_usados_slug_idx" ON "equipos_usados" USING btree ("slug");
  CREATE INDEX "equipos_usados_seo_seo_og_image_idx" ON "equipos_usados" USING btree ("seo_og_image_id");
  CREATE UNIQUE INDEX "categoria_slug_idx" ON "equipos_usados" USING btree ("categoria_id","slug");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_usados" DROP CONSTRAINT "equipos_usados_seo_og_image_id_media_id_fk";
  
  DROP INDEX "equipos_usados_slug_idx";
  DROP INDEX "equipos_usados_seo_seo_og_image_idx";
  DROP INDEX "categoria_slug_idx";
  ALTER TABLE "equipos_usados" DROP COLUMN "slug";
  ALTER TABLE "equipos_usados" DROP COLUMN "seo_meta_title";
  ALTER TABLE "equipos_usados" DROP COLUMN "seo_meta_description";
  ALTER TABLE "equipos_usados" DROP COLUMN "seo_og_image_id";`)
}
