import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "marcas_lubricante" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"entradilla" varchar,
  	"descripcion" jsonb,
  	"logo_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categorias_lubricante_productos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"descripcion" varchar
  );
  
  CREATE TABLE "categorias_lubricante" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"marca_id" integer NOT NULL,
  	"entradilla" varchar,
  	"descripcion" jsonb,
  	"imagen_id" integer,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "marcas_lubricante_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categorias_lubricante_id" integer;
  ALTER TABLE "marcas_lubricante" ADD CONSTRAINT "marcas_lubricante_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_lubricante" ADD CONSTRAINT "marcas_lubricante_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_lubricante_productos" ADD CONSTRAINT "categorias_lubricante_productos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categorias_lubricante"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_lubricante" ADD CONSTRAINT "categorias_lubricante_marca_id_marcas_lubricante_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas_lubricante"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_lubricante" ADD CONSTRAINT "categorias_lubricante_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_lubricante" ADD CONSTRAINT "categorias_lubricante_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "marcas_lubricante_slug_idx" ON "marcas_lubricante" USING btree ("slug");
  CREATE INDEX "marcas_lubricante_logo_idx" ON "marcas_lubricante" USING btree ("logo_id");
  CREATE INDEX "marcas_lubricante_seo_seo_og_image_idx" ON "marcas_lubricante" USING btree ("seo_og_image_id");
  CREATE INDEX "marcas_lubricante_updated_at_idx" ON "marcas_lubricante" USING btree ("updated_at");
  CREATE INDEX "marcas_lubricante_created_at_idx" ON "marcas_lubricante" USING btree ("created_at");
  CREATE INDEX "categorias_lubricante_productos_order_idx" ON "categorias_lubricante_productos" USING btree ("_order");
  CREATE INDEX "categorias_lubricante_productos_parent_id_idx" ON "categorias_lubricante_productos" USING btree ("_parent_id");
  CREATE INDEX "categorias_lubricante_slug_idx" ON "categorias_lubricante" USING btree ("slug");
  CREATE INDEX "categorias_lubricante_marca_idx" ON "categorias_lubricante" USING btree ("marca_id");
  CREATE INDEX "categorias_lubricante_imagen_idx" ON "categorias_lubricante" USING btree ("imagen_id");
  CREATE INDEX "categorias_lubricante_seo_seo_og_image_idx" ON "categorias_lubricante" USING btree ("seo_og_image_id");
  CREATE INDEX "categorias_lubricante_updated_at_idx" ON "categorias_lubricante" USING btree ("updated_at");
  CREATE INDEX "categorias_lubricante_created_at_idx" ON "categorias_lubricante" USING btree ("created_at");
  CREATE UNIQUE INDEX "marca_slug_2_idx" ON "categorias_lubricante" USING btree ("marca_id","slug");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_marcas_lubricante_fk" FOREIGN KEY ("marcas_lubricante_id") REFERENCES "public"."marcas_lubricante"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorias_lubricante_fk" FOREIGN KEY ("categorias_lubricante_id") REFERENCES "public"."categorias_lubricante"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_marcas_lubricante_id_idx" ON "payload_locked_documents_rels" USING btree ("marcas_lubricante_id");
  CREATE INDEX "payload_locked_documents_rels_categorias_lubricante_id_idx" ON "payload_locked_documents_rels" USING btree ("categorias_lubricante_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categorias_lubricante_productos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categorias_lubricante" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "marcas_lubricante" CASCADE;
  DROP TABLE "categorias_lubricante_productos" CASCADE;
  DROP TABLE "categorias_lubricante" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_marcas_lubricante_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categorias_lubricante_fk";
  
  DROP INDEX "payload_locked_documents_rels_marcas_lubricante_id_idx";
  DROP INDEX "payload_locked_documents_rels_categorias_lubricante_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "marcas_lubricante_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categorias_lubricante_id";`)
}
