import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "categorias_blog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "articulos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"categoria_id" integer,
  	"fecha_publicacion" timestamp(3) with time zone NOT NULL,
  	"autor" varchar,
  	"entradilla" varchar,
  	"imagen_destacada_id" integer,
  	"contenido" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categorias_blog_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "articulos_id" integer;
  ALTER TABLE "categorias_blog" ADD CONSTRAINT "categorias_blog_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articulos" ADD CONSTRAINT "articulos_categoria_id_categorias_blog_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_blog"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articulos" ADD CONSTRAINT "articulos_imagen_destacada_id_media_id_fk" FOREIGN KEY ("imagen_destacada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articulos" ADD CONSTRAINT "articulos_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "categorias_blog_slug_idx" ON "categorias_blog" USING btree ("slug");
  CREATE INDEX "categorias_blog_seo_seo_og_image_idx" ON "categorias_blog" USING btree ("seo_og_image_id");
  CREATE INDEX "categorias_blog_updated_at_idx" ON "categorias_blog" USING btree ("updated_at");
  CREATE INDEX "categorias_blog_created_at_idx" ON "categorias_blog" USING btree ("created_at");
  CREATE UNIQUE INDEX "articulos_slug_idx" ON "articulos" USING btree ("slug");
  CREATE INDEX "articulos_categoria_idx" ON "articulos" USING btree ("categoria_id");
  CREATE INDEX "articulos_imagen_destacada_idx" ON "articulos" USING btree ("imagen_destacada_id");
  CREATE INDEX "articulos_seo_seo_og_image_idx" ON "articulos" USING btree ("seo_og_image_id");
  CREATE INDEX "articulos_updated_at_idx" ON "articulos" USING btree ("updated_at");
  CREATE INDEX "articulos_created_at_idx" ON "articulos" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorias_blog_fk" FOREIGN KEY ("categorias_blog_id") REFERENCES "public"."categorias_blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articulos_fk" FOREIGN KEY ("articulos_id") REFERENCES "public"."articulos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_categorias_blog_id_idx" ON "payload_locked_documents_rels" USING btree ("categorias_blog_id");
  CREATE INDEX "payload_locked_documents_rels_articulos_id_idx" ON "payload_locked_documents_rels" USING btree ("articulos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_blog" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "articulos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categorias_blog" CASCADE;
  DROP TABLE "articulos" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categorias_blog_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_articulos_fk";
  
  DROP INDEX "payload_locked_documents_rels_categorias_blog_id_idx";
  DROP INDEX "payload_locked_documents_rels_articulos_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categorias_blog_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "articulos_id";`)
}
