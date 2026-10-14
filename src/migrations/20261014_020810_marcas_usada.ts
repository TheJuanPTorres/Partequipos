import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "marcas_usada" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"logo_id" integer,
  	"marca_nueva_id" integer,
  	"marca_repuestos_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"actualizado_por_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "equipos_usados" ADD COLUMN "marca_usada_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "marcas_usada_id" integer;
  ALTER TABLE "marcas_usada" ADD CONSTRAINT "marcas_usada_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_usada" ADD CONSTRAINT "marcas_usada_marca_nueva_id_marcas_maquinaria_id_fk" FOREIGN KEY ("marca_nueva_id") REFERENCES "public"."marcas_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_usada" ADD CONSTRAINT "marcas_usada_marca_repuestos_id_marcas_id_fk" FOREIGN KEY ("marca_repuestos_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_usada" ADD CONSTRAINT "marcas_usada_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_usada" ADD CONSTRAINT "marcas_usada_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "marcas_usada_slug_idx" ON "marcas_usada" USING btree ("slug");
  CREATE INDEX "marcas_usada_logo_idx" ON "marcas_usada" USING btree ("logo_id");
  CREATE INDEX "marcas_usada_marca_nueva_idx" ON "marcas_usada" USING btree ("marca_nueva_id");
  CREATE INDEX "marcas_usada_marca_repuestos_idx" ON "marcas_usada" USING btree ("marca_repuestos_id");
  CREATE INDEX "marcas_usada_seo_seo_og_image_idx" ON "marcas_usada" USING btree ("seo_og_image_id");
  CREATE INDEX "marcas_usada_actualizado_por_idx" ON "marcas_usada" USING btree ("actualizado_por_id");
  CREATE INDEX "marcas_usada_updated_at_idx" ON "marcas_usada" USING btree ("updated_at");
  CREATE INDEX "marcas_usada_created_at_idx" ON "marcas_usada" USING btree ("created_at");
  ALTER TABLE "equipos_usados" ADD CONSTRAINT "equipos_usados_marca_usada_id_marcas_usada_id_fk" FOREIGN KEY ("marca_usada_id") REFERENCES "public"."marcas_usada"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_marcas_usada_fk" FOREIGN KEY ("marcas_usada_id") REFERENCES "public"."marcas_usada"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "equipos_usados_marca_usada_idx" ON "equipos_usados" USING btree ("marca_usada_id");
  CREATE INDEX "payload_locked_documents_rels_marcas_usada_id_idx" ON "payload_locked_documents_rels" USING btree ("marcas_usada_id");`)

  /*
   * RELLENO (paso b del marketplace, 2026-10-13). SQL explícito, sin la API
   * local (CLAUDE.md §3.5): solo toca `equipos_usados` y `marcas_usada`, que
   * existen en este punto del historial.
   *
   * Una marca por cada valor distinto del texto `marca`, con el MISMO slug que
   * `formatSlug` (minúsculas, sin tildes, lo demás a guiones; comprobado contra
   * las marcas del preview): así el gancho `marcaUsadaSincronizada` encuentra
   * esta marca y no crea otra. Después, cada unidad apunta a la suya.
   */
  await db.execute(sql`
   INSERT INTO "marcas_usada" ("nombre", "slug", "updated_at", "created_at")
  SELECT DISTINCT ON (s."slug") s."nombre", s."slug", now(), now()
  FROM (
    SELECT
      regexp_replace(trim("marca"), '[[:space:]]+', ' ', 'g') AS "nombre",
      trim(BOTH '-' FROM regexp_replace(
        translate(lower(trim("marca")), 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc'),
        '[^a-z0-9]+', '-', 'g'
      )) AS "slug"
    FROM "equipos_usados"
    WHERE "marca" IS NOT NULL AND trim("marca") <> ''
  ) s
  WHERE s."slug" <> ''
  ORDER BY s."slug", s."nombre"
  ON CONFLICT ("slug") DO NOTHING;

  UPDATE "equipos_usados" e
  SET "marca_usada_id" = m."id"
  FROM "marcas_usada" m
  WHERE e."marca_usada_id" IS NULL
    AND m."slug" = trim(BOTH '-' FROM regexp_replace(
      translate(lower(trim(e."marca")), 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc'),
      '[^a-z0-9]+', '-', 'g'
    ));`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_usada" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "marcas_usada" CASCADE;
  ALTER TABLE "equipos_usados" DROP CONSTRAINT "equipos_usados_marca_usada_id_marcas_usada_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_marcas_usada_fk";
  
  DROP INDEX "equipos_usados_marca_usada_idx";
  DROP INDEX "payload_locked_documents_rels_marcas_usada_id_idx";
  ALTER TABLE "equipos_usados" DROP COLUMN "marca_usada_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "marcas_usada_id";`)
}
