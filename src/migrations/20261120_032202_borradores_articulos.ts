import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articulos_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__articulos_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_articulos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titulo" varchar,
  	"version_slug" varchar,
  	"version_categoria_id" integer,
  	"version_fecha_publicacion" timestamp(3) with time zone,
  	"version_destacado" boolean DEFAULT false,
  	"version_autor" varchar,
  	"version_entradilla" varchar,
  	"version_imagen_destacada_id" integer,
  	"version_contenido" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_actualizado_por_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__articulos_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_articulos_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categorias_tecnicas_id" integer,
  	"categorias_usada_id" integer,
  	"categorias_maquinaria_id" integer
  );
  
  ALTER TABLE "articulos" ALTER COLUMN "titulo" DROP NOT NULL;
  ALTER TABLE "articulos" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "articulos" ALTER COLUMN "fecha_publicacion" DROP NOT NULL;
  ALTER TABLE "articulos" ADD COLUMN "_status" "enum_articulos_status" DEFAULT 'draft';
  -- Lo que ya existe estaba publicado: sin esto, todo el blog pasaría a borrador y saldría de la web.
  UPDATE "articulos" SET "_status" = 'published';
  ALTER TABLE "_articulos_v" ADD CONSTRAINT "_articulos_v_parent_id_articulos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articulos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articulos_v" ADD CONSTRAINT "_articulos_v_version_categoria_id_categorias_blog_id_fk" FOREIGN KEY ("version_categoria_id") REFERENCES "public"."categorias_blog"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articulos_v" ADD CONSTRAINT "_articulos_v_version_imagen_destacada_id_media_id_fk" FOREIGN KEY ("version_imagen_destacada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articulos_v" ADD CONSTRAINT "_articulos_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articulos_v" ADD CONSTRAINT "_articulos_v_version_actualizado_por_id_users_id_fk" FOREIGN KEY ("version_actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_articulos_v_rels" ADD CONSTRAINT "_articulos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_articulos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articulos_v_rels" ADD CONSTRAINT "_articulos_v_rels_categorias_tecnicas_fk" FOREIGN KEY ("categorias_tecnicas_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articulos_v_rels" ADD CONSTRAINT "_articulos_v_rels_categorias_usada_fk" FOREIGN KEY ("categorias_usada_id") REFERENCES "public"."categorias_usada"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_articulos_v_rels" ADD CONSTRAINT "_articulos_v_rels_categorias_maquinaria_fk" FOREIGN KEY ("categorias_maquinaria_id") REFERENCES "public"."categorias_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_articulos_v_parent_idx" ON "_articulos_v" USING btree ("parent_id");
  CREATE INDEX "_articulos_v_version_version_slug_idx" ON "_articulos_v" USING btree ("version_slug");
  CREATE INDEX "_articulos_v_version_version_categoria_idx" ON "_articulos_v" USING btree ("version_categoria_id");
  CREATE INDEX "_articulos_v_version_version_imagen_destacada_idx" ON "_articulos_v" USING btree ("version_imagen_destacada_id");
  CREATE INDEX "_articulos_v_version_seo_version_seo_og_image_idx" ON "_articulos_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_articulos_v_version_version_actualizado_por_idx" ON "_articulos_v" USING btree ("version_actualizado_por_id");
  CREATE INDEX "_articulos_v_version_version_updated_at_idx" ON "_articulos_v" USING btree ("version_updated_at");
  CREATE INDEX "_articulos_v_version_version_created_at_idx" ON "_articulos_v" USING btree ("version_created_at");
  CREATE INDEX "_articulos_v_version_version__status_idx" ON "_articulos_v" USING btree ("version__status");
  CREATE INDEX "_articulos_v_created_at_idx" ON "_articulos_v" USING btree ("created_at");
  CREATE INDEX "_articulos_v_updated_at_idx" ON "_articulos_v" USING btree ("updated_at");
  CREATE INDEX "_articulos_v_latest_idx" ON "_articulos_v" USING btree ("latest");
  CREATE INDEX "_articulos_v_rels_order_idx" ON "_articulos_v_rels" USING btree ("order");
  CREATE INDEX "_articulos_v_rels_parent_idx" ON "_articulos_v_rels" USING btree ("parent_id");
  CREATE INDEX "_articulos_v_rels_path_idx" ON "_articulos_v_rels" USING btree ("path");
  CREATE INDEX "_articulos_v_rels_categorias_tecnicas_id_idx" ON "_articulos_v_rels" USING btree ("categorias_tecnicas_id");
  CREATE INDEX "_articulos_v_rels_categorias_usada_id_idx" ON "_articulos_v_rels" USING btree ("categorias_usada_id");
  CREATE INDEX "_articulos_v_rels_categorias_maquinaria_id_idx" ON "_articulos_v_rels" USING btree ("categorias_maquinaria_id");
  CREATE INDEX "articulos__status_idx" ON "articulos" USING btree ("_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_articulos_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_articulos_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_articulos_v" CASCADE;
  DROP TABLE "_articulos_v_rels" CASCADE;
  DROP INDEX "articulos__status_idx";
  ALTER TABLE "articulos" ALTER COLUMN "titulo" SET NOT NULL;
  ALTER TABLE "articulos" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "articulos" ALTER COLUMN "fecha_publicacion" SET NOT NULL;
  ALTER TABLE "articulos" DROP COLUMN "_status";
  DROP TYPE "public"."enum_articulos_status";
  DROP TYPE "public"."enum__articulos_v_version_status";`)
}
