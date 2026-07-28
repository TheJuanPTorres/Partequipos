import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_redirects_tipo" AS ENUM('301', '302');
  CREATE TYPE "public"."enum_redirects_origen" AS ENUM('manual', 'cambio-de-slug', 'migracion');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"puede_editar_slugs" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "marcas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"logo_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tipos_equipo" (
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
  
  CREATE TABLE "modelos_repuesto" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"marca_id" integer NOT NULL,
  	"tipo_id" integer NOT NULL,
  	"codigo" varchar,
  	"descripcion" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "modelos_repuesto_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "categorias_tecnicas" (
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
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"desde" varchar NOT NULL,
  	"hacia" varchar NOT NULL,
  	"tipo" "enum_redirects_tipo" DEFAULT '301' NOT NULL,
  	"origen" "enum_redirects_origen" DEFAULT 'manual' NOT NULL,
  	"notas" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"marcas_id" integer,
  	"tipos_equipo_id" integer,
  	"modelos_repuesto_id" integer,
  	"categorias_tecnicas_id" integer,
  	"redirects_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "marcas" ADD CONSTRAINT "marcas_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_equipo" ADD CONSTRAINT "tipos_equipo_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_equipo" ADD CONSTRAINT "tipos_equipo_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modelos_repuesto" ADD CONSTRAINT "modelos_repuesto_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modelos_repuesto" ADD CONSTRAINT "modelos_repuesto_tipo_id_tipos_equipo_id_fk" FOREIGN KEY ("tipo_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modelos_repuesto" ADD CONSTRAINT "modelos_repuesto_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modelos_repuesto_rels" ADD CONSTRAINT "modelos_repuesto_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."modelos_repuesto"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "modelos_repuesto_rels" ADD CONSTRAINT "modelos_repuesto_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_marcas_fk" FOREIGN KEY ("marcas_id") REFERENCES "public"."marcas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tipos_equipo_fk" FOREIGN KEY ("tipos_equipo_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modelos_repuesto_fk" FOREIGN KEY ("modelos_repuesto_id") REFERENCES "public"."modelos_repuesto"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorias_tecnicas_fk" FOREIGN KEY ("categorias_tecnicas_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "marcas_slug_idx" ON "marcas" USING btree ("slug");
  CREATE INDEX "marcas_logo_idx" ON "marcas" USING btree ("logo_id");
  CREATE INDEX "marcas_updated_at_idx" ON "marcas" USING btree ("updated_at");
  CREATE INDEX "marcas_created_at_idx" ON "marcas" USING btree ("created_at");
  CREATE INDEX "tipos_equipo_slug_idx" ON "tipos_equipo" USING btree ("slug");
  CREATE INDEX "tipos_equipo_marca_idx" ON "tipos_equipo" USING btree ("marca_id");
  CREATE INDEX "tipos_equipo_seo_seo_og_image_idx" ON "tipos_equipo" USING btree ("seo_og_image_id");
  CREATE INDEX "tipos_equipo_updated_at_idx" ON "tipos_equipo" USING btree ("updated_at");
  CREATE INDEX "tipos_equipo_created_at_idx" ON "tipos_equipo" USING btree ("created_at");
  CREATE UNIQUE INDEX "marca_slug_idx" ON "tipos_equipo" USING btree ("marca_id","slug");
  CREATE INDEX "modelos_repuesto_slug_idx" ON "modelos_repuesto" USING btree ("slug");
  CREATE INDEX "modelos_repuesto_marca_idx" ON "modelos_repuesto" USING btree ("marca_id");
  CREATE INDEX "modelos_repuesto_tipo_idx" ON "modelos_repuesto" USING btree ("tipo_id");
  CREATE INDEX "modelos_repuesto_seo_seo_og_image_idx" ON "modelos_repuesto" USING btree ("seo_og_image_id");
  CREATE INDEX "modelos_repuesto_updated_at_idx" ON "modelos_repuesto" USING btree ("updated_at");
  CREATE INDEX "modelos_repuesto_created_at_idx" ON "modelos_repuesto" USING btree ("created_at");
  CREATE UNIQUE INDEX "tipo_slug_idx" ON "modelos_repuesto" USING btree ("tipo_id","slug");
  CREATE INDEX "modelos_repuesto_rels_order_idx" ON "modelos_repuesto_rels" USING btree ("order");
  CREATE INDEX "modelos_repuesto_rels_parent_idx" ON "modelos_repuesto_rels" USING btree ("parent_id");
  CREATE INDEX "modelos_repuesto_rels_path_idx" ON "modelos_repuesto_rels" USING btree ("path");
  CREATE INDEX "modelos_repuesto_rels_media_id_idx" ON "modelos_repuesto_rels" USING btree ("media_id");
  CREATE UNIQUE INDEX "categorias_tecnicas_slug_idx" ON "categorias_tecnicas" USING btree ("slug");
  CREATE INDEX "categorias_tecnicas_seo_seo_og_image_idx" ON "categorias_tecnicas" USING btree ("seo_og_image_id");
  CREATE INDEX "categorias_tecnicas_updated_at_idx" ON "categorias_tecnicas" USING btree ("updated_at");
  CREATE INDEX "categorias_tecnicas_created_at_idx" ON "categorias_tecnicas" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_desde_idx" ON "redirects" USING btree ("desde");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_marcas_id_idx" ON "payload_locked_documents_rels" USING btree ("marcas_id");
  CREATE INDEX "payload_locked_documents_rels_tipos_equipo_id_idx" ON "payload_locked_documents_rels" USING btree ("tipos_equipo_id");
  CREATE INDEX "payload_locked_documents_rels_modelos_repuesto_id_idx" ON "payload_locked_documents_rels" USING btree ("modelos_repuesto_id");
  CREATE INDEX "payload_locked_documents_rels_categorias_tecnicas_id_idx" ON "payload_locked_documents_rels" USING btree ("categorias_tecnicas_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "marcas" CASCADE;
  DROP TABLE "tipos_equipo" CASCADE;
  DROP TABLE "modelos_repuesto" CASCADE;
  DROP TABLE "modelos_repuesto_rels" CASCADE;
  DROP TABLE "categorias_tecnicas" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_redirects_tipo";
  DROP TYPE "public"."enum_redirects_origen";`)
}
