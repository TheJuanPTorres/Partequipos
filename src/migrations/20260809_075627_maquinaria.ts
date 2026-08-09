import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "marcas_maquinaria" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"logo_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tipos_maquinaria" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"marca_id" integer NOT NULL,
  	"descripcion" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipos_nuevos_destacados" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL
  );
  
  CREATE TABLE "equipos_nuevos_ficha_tecnica" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"valor" varchar NOT NULL
  );
  
  CREATE TABLE "equipos_nuevos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"marca_id" integer NOT NULL,
  	"tipo_id" integer NOT NULL,
  	"codigo" varchar,
  	"entradilla" varchar,
  	"descripcion" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipos_nuevos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "categorias_maquinaria" (
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
  
  CREATE TABLE "categorias_maquinaria_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tipos_maquinaria_id" integer
  );
  
  CREATE TABLE "categorias_usada" (
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
  
  CREATE TABLE "equipos_usados" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"categoria_id" integer NOT NULL,
  	"marca" varchar,
  	"modelo" varchar,
  	"anio" numeric,
  	"horometro" numeric,
  	"ubicacion" varchar,
  	"descripcion" varchar,
  	"disponible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipos_usados_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "marcas_maquinaria_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tipos_maquinaria_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "equipos_nuevos_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categorias_maquinaria_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categorias_usada_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "equipos_usados_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_maquinaria" ADD CONSTRAINT "tipos_maquinaria_marca_id_marcas_maquinaria_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_maquinaria" ADD CONSTRAINT "tipos_maquinaria_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_nuevos_destacados" ADD CONSTRAINT "equipos_nuevos_destacados_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipos_nuevos_ficha_tecnica" ADD CONSTRAINT "equipos_nuevos_ficha_tecnica_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipos_nuevos" ADD CONSTRAINT "equipos_nuevos_marca_id_marcas_maquinaria_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_nuevos" ADD CONSTRAINT "equipos_nuevos_tipo_id_tipos_maquinaria_id_fk" FOREIGN KEY ("tipo_id") REFERENCES "public"."tipos_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_nuevos" ADD CONSTRAINT "equipos_nuevos_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_nuevos_rels" ADD CONSTRAINT "equipos_nuevos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipos_nuevos_rels" ADD CONSTRAINT "equipos_nuevos_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_maquinaria" ADD CONSTRAINT "categorias_maquinaria_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_maquinaria_rels" ADD CONSTRAINT "categorias_maquinaria_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categorias_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_maquinaria_rels" ADD CONSTRAINT "categorias_maquinaria_rels_tipos_maquinaria_fk" FOREIGN KEY ("tipos_maquinaria_id") REFERENCES "public"."tipos_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_usada" ADD CONSTRAINT "categorias_usada_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_usados" ADD CONSTRAINT "equipos_usados_categoria_id_categorias_usada_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_usada"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_usados_rels" ADD CONSTRAINT "equipos_usados_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipos_usados"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipos_usados_rels" ADD CONSTRAINT "equipos_usados_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "marcas_maquinaria_slug_idx" ON "marcas_maquinaria" USING btree ("slug");
  CREATE INDEX "marcas_maquinaria_logo_idx" ON "marcas_maquinaria" USING btree ("logo_id");
  CREATE INDEX "marcas_maquinaria_seo_seo_og_image_idx" ON "marcas_maquinaria" USING btree ("seo_og_image_id");
  CREATE INDEX "marcas_maquinaria_updated_at_idx" ON "marcas_maquinaria" USING btree ("updated_at");
  CREATE INDEX "marcas_maquinaria_created_at_idx" ON "marcas_maquinaria" USING btree ("created_at");
  CREATE INDEX "tipos_maquinaria_slug_idx" ON "tipos_maquinaria" USING btree ("slug");
  CREATE INDEX "tipos_maquinaria_marca_idx" ON "tipos_maquinaria" USING btree ("marca_id");
  CREATE INDEX "tipos_maquinaria_seo_seo_og_image_idx" ON "tipos_maquinaria" USING btree ("seo_og_image_id");
  CREATE INDEX "tipos_maquinaria_updated_at_idx" ON "tipos_maquinaria" USING btree ("updated_at");
  CREATE INDEX "tipos_maquinaria_created_at_idx" ON "tipos_maquinaria" USING btree ("created_at");
  CREATE UNIQUE INDEX "marca_slug_1_idx" ON "tipos_maquinaria" USING btree ("marca_id","slug");
  CREATE INDEX "equipos_nuevos_destacados_order_idx" ON "equipos_nuevos_destacados" USING btree ("_order");
  CREATE INDEX "equipos_nuevos_destacados_parent_id_idx" ON "equipos_nuevos_destacados" USING btree ("_parent_id");
  CREATE INDEX "equipos_nuevos_ficha_tecnica_order_idx" ON "equipos_nuevos_ficha_tecnica" USING btree ("_order");
  CREATE INDEX "equipos_nuevos_ficha_tecnica_parent_id_idx" ON "equipos_nuevos_ficha_tecnica" USING btree ("_parent_id");
  CREATE INDEX "equipos_nuevos_slug_idx" ON "equipos_nuevos" USING btree ("slug");
  CREATE INDEX "equipos_nuevos_marca_idx" ON "equipos_nuevos" USING btree ("marca_id");
  CREATE INDEX "equipos_nuevos_tipo_idx" ON "equipos_nuevos" USING btree ("tipo_id");
  CREATE INDEX "equipos_nuevos_seo_seo_og_image_idx" ON "equipos_nuevos" USING btree ("seo_og_image_id");
  CREATE INDEX "equipos_nuevos_updated_at_idx" ON "equipos_nuevos" USING btree ("updated_at");
  CREATE INDEX "equipos_nuevos_created_at_idx" ON "equipos_nuevos" USING btree ("created_at");
  CREATE UNIQUE INDEX "tipo_slug_1_idx" ON "equipos_nuevos" USING btree ("tipo_id","slug");
  CREATE INDEX "equipos_nuevos_rels_order_idx" ON "equipos_nuevos_rels" USING btree ("order");
  CREATE INDEX "equipos_nuevos_rels_parent_idx" ON "equipos_nuevos_rels" USING btree ("parent_id");
  CREATE INDEX "equipos_nuevos_rels_path_idx" ON "equipos_nuevos_rels" USING btree ("path");
  CREATE INDEX "equipos_nuevos_rels_media_id_idx" ON "equipos_nuevos_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "categorias_maquinaria_slug_idx" ON "categorias_maquinaria" USING btree ("slug");
  CREATE INDEX "categorias_maquinaria_seo_seo_og_image_idx" ON "categorias_maquinaria" USING btree ("seo_og_image_id");
  CREATE INDEX "categorias_maquinaria_updated_at_idx" ON "categorias_maquinaria" USING btree ("updated_at");
  CREATE INDEX "categorias_maquinaria_created_at_idx" ON "categorias_maquinaria" USING btree ("created_at");
  CREATE INDEX "categorias_maquinaria_rels_order_idx" ON "categorias_maquinaria_rels" USING btree ("order");
  CREATE INDEX "categorias_maquinaria_rels_parent_idx" ON "categorias_maquinaria_rels" USING btree ("parent_id");
  CREATE INDEX "categorias_maquinaria_rels_path_idx" ON "categorias_maquinaria_rels" USING btree ("path");
  CREATE INDEX "categorias_maquinaria_rels_tipos_maquinaria_id_idx" ON "categorias_maquinaria_rels" USING btree ("tipos_maquinaria_id");
  CREATE UNIQUE INDEX "categorias_usada_slug_idx" ON "categorias_usada" USING btree ("slug");
  CREATE INDEX "categorias_usada_seo_seo_og_image_idx" ON "categorias_usada" USING btree ("seo_og_image_id");
  CREATE INDEX "categorias_usada_updated_at_idx" ON "categorias_usada" USING btree ("updated_at");
  CREATE INDEX "categorias_usada_created_at_idx" ON "categorias_usada" USING btree ("created_at");
  CREATE INDEX "equipos_usados_categoria_idx" ON "equipos_usados" USING btree ("categoria_id");
  CREATE INDEX "equipos_usados_updated_at_idx" ON "equipos_usados" USING btree ("updated_at");
  CREATE INDEX "equipos_usados_created_at_idx" ON "equipos_usados" USING btree ("created_at");
  CREATE INDEX "equipos_usados_rels_order_idx" ON "equipos_usados_rels" USING btree ("order");
  CREATE INDEX "equipos_usados_rels_parent_idx" ON "equipos_usados_rels" USING btree ("parent_id");
  CREATE INDEX "equipos_usados_rels_path_idx" ON "equipos_usados_rels" USING btree ("path");
  CREATE INDEX "equipos_usados_rels_media_id_idx" ON "equipos_usados_rels" USING btree ("media_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_marcas_maquinaria_fk" FOREIGN KEY ("marcas_maquinaria_id") REFERENCES "public"."marcas_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tipos_maquinaria_fk" FOREIGN KEY ("tipos_maquinaria_id") REFERENCES "public"."tipos_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipos_nuevos_fk" FOREIGN KEY ("equipos_nuevos_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorias_maquinaria_fk" FOREIGN KEY ("categorias_maquinaria_id") REFERENCES "public"."categorias_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorias_usada_fk" FOREIGN KEY ("categorias_usada_id") REFERENCES "public"."categorias_usada"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipos_usados_fk" FOREIGN KEY ("equipos_usados_id") REFERENCES "public"."equipos_usados"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_marcas_maquinaria_id_idx" ON "payload_locked_documents_rels" USING btree ("marcas_maquinaria_id");
  CREATE INDEX "payload_locked_documents_rels_tipos_maquinaria_id_idx" ON "payload_locked_documents_rels" USING btree ("tipos_maquinaria_id");
  CREATE INDEX "payload_locked_documents_rels_equipos_nuevos_id_idx" ON "payload_locked_documents_rels" USING btree ("equipos_nuevos_id");
  CREATE INDEX "payload_locked_documents_rels_categorias_maquinaria_id_idx" ON "payload_locked_documents_rels" USING btree ("categorias_maquinaria_id");
  CREATE INDEX "payload_locked_documents_rels_categorias_usada_id_idx" ON "payload_locked_documents_rels" USING btree ("categorias_usada_id");
  CREATE INDEX "payload_locked_documents_rels_equipos_usados_id_idx" ON "payload_locked_documents_rels" USING btree ("equipos_usados_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tipos_maquinaria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipos_nuevos_destacados" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipos_nuevos_ficha_tecnica" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipos_nuevos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipos_nuevos_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categorias_maquinaria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categorias_maquinaria_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categorias_usada" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipos_usados" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipos_usados_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "marcas_maquinaria" CASCADE;
  DROP TABLE "tipos_maquinaria" CASCADE;
  DROP TABLE "equipos_nuevos_destacados" CASCADE;
  DROP TABLE "equipos_nuevos_ficha_tecnica" CASCADE;
  DROP TABLE "equipos_nuevos" CASCADE;
  DROP TABLE "equipos_nuevos_rels" CASCADE;
  DROP TABLE "categorias_maquinaria" CASCADE;
  DROP TABLE "categorias_maquinaria_rels" CASCADE;
  DROP TABLE "categorias_usada" CASCADE;
  DROP TABLE "equipos_usados" CASCADE;
  DROP TABLE "equipos_usados_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_marcas_maquinaria_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tipos_maquinaria_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_equipos_nuevos_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categorias_maquinaria_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categorias_usada_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_equipos_usados_fk";
  
  DROP INDEX "payload_locked_documents_rels_marcas_maquinaria_id_idx";
  DROP INDEX "payload_locked_documents_rels_tipos_maquinaria_id_idx";
  DROP INDEX "payload_locked_documents_rels_equipos_nuevos_id_idx";
  DROP INDEX "payload_locked_documents_rels_categorias_maquinaria_id_idx";
  DROP INDEX "payload_locked_documents_rels_categorias_usada_id_idx";
  DROP INDEX "payload_locked_documents_rels_equipos_usados_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "marcas_maquinaria_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tipos_maquinaria_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "equipos_nuevos_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categorias_maquinaria_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categorias_usada_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "equipos_usados_id";`)
}
