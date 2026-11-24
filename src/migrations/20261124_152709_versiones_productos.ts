import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__equipos_nuevos_v_version_ficha_tecnica_icono" AS ENUM('peso', 'potencia', 'motor', 'capacidad', 'alcance', 'profundidad', 'velocidad', 'otro');
  CREATE TYPE "public"."enum__equipos_usados_v_version_pestana_portada" AS ENUM('categoria', 'aditamentos');
  CREATE TABLE "_modelos_repuesto_v_version_piezas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_modelos_repuesto_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__modelos_repuesto_modelos_order" varchar,
  	"version_nombre" varchar NOT NULL,
  	"version_marca_id" integer NOT NULL,
  	"version_tipo_id" integer NOT NULL,
  	"version_codigo" varchar,
  	"version_serie" varchar,
  	"version_descripcion" varchar,
  	"version_antetitulo" varchar,
  	"version_titulo_pagina" varchar,
  	"version_titulo_disponibles" varchar,
  	"version_mostrar_piezas" boolean DEFAULT false,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_mostrar_en_web" boolean DEFAULT true,
  	"version_slug" varchar NOT NULL,
  	"version_actualizado_por_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_modelos_repuesto_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_equipos_nuevos_v_version_ficha_tecnica" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"valor" varchar NOT NULL,
  	"destacar" boolean DEFAULT false,
  	"icono" "enum__equipos_nuevos_v_version_ficha_tecnica_icono",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_equipos_nuevos_v_version_destacados" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_equipos_nuevos_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version__equipos_nuevos_equipos_order" varchar,
  	"version_nombre" varchar NOT NULL,
  	"version_marca_id" integer NOT NULL,
  	"version_tipo_id" integer NOT NULL,
  	"version_codigo" varchar,
  	"version_entradilla" varchar,
  	"version_descripcion" jsonb,
  	"version_ficha_tecnica_pdf_id" integer,
  	"version_vista360" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_mostrar_en_web" boolean DEFAULT true,
  	"version_slug" varchar NOT NULL,
  	"version_orden" numeric,
  	"version_peso_operativo_kg" numeric,
  	"version__order" varchar,
  	"version_actualizado_por_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_equipos_nuevos_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_equipos_usados_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_nombre" varchar NOT NULL,
  	"version_categoria_id" integer NOT NULL,
  	"version_marca_usada_id" integer,
  	"version_modelo" varchar,
  	"version_anio" numeric,
  	"version_horometro" numeric,
  	"version_ubicacion" varchar,
  	"version_peso_operativo" numeric,
  	"version_potencia" numeric,
  	"version_motor" varchar,
  	"version_serial" varchar,
  	"version_descripcion_corta" varchar,
  	"version_descripcion" varchar,
  	"version_ficha_tecnica_pdf_id" integer,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_slug" varchar,
  	"version_mostrar_en_web" boolean DEFAULT true,
  	"version_disponible" boolean DEFAULT true,
  	"version_fecha_publicacion" timestamp(3) with time zone,
  	"version_pestana_portada" "enum__equipos_usados_v_version_pestana_portada" DEFAULT 'categoria',
  	"version_marca" varchar,
  	"version_actualizado_por_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_equipos_usados_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "_modelos_repuesto_v_version_piezas" ADD CONSTRAINT "_modelos_repuesto_v_version_piezas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_modelos_repuesto_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v" ADD CONSTRAINT "_modelos_repuesto_v_parent_id_modelos_repuesto_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."modelos_repuesto"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v" ADD CONSTRAINT "_modelos_repuesto_v_version_marca_id_marcas_id_fk" FOREIGN KEY ("version_marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v" ADD CONSTRAINT "_modelos_repuesto_v_version_tipo_id_tipos_equipo_id_fk" FOREIGN KEY ("version_tipo_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v" ADD CONSTRAINT "_modelos_repuesto_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v" ADD CONSTRAINT "_modelos_repuesto_v_version_actualizado_por_id_users_id_fk" FOREIGN KEY ("version_actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v_rels" ADD CONSTRAINT "_modelos_repuesto_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_modelos_repuesto_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_modelos_repuesto_v_rels" ADD CONSTRAINT "_modelos_repuesto_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v_version_ficha_tecnica" ADD CONSTRAINT "_equipos_nuevos_v_version_ficha_tecnica_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_equipos_nuevos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v_version_destacados" ADD CONSTRAINT "_equipos_nuevos_v_version_destacados_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_equipos_nuevos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v" ADD CONSTRAINT "_equipos_nuevos_v_parent_id_equipos_nuevos_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v" ADD CONSTRAINT "_equipos_nuevos_v_version_marca_id_marcas_maquinaria_id_fk" FOREIGN KEY ("version_marca_id") REFERENCES "public"."marcas_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v" ADD CONSTRAINT "_equipos_nuevos_v_version_tipo_id_tipos_maquinaria_id_fk" FOREIGN KEY ("version_tipo_id") REFERENCES "public"."tipos_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v" ADD CONSTRAINT "_equipos_nuevos_v_version_ficha_tecnica_pdf_id_documentos_id_fk" FOREIGN KEY ("version_ficha_tecnica_pdf_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v" ADD CONSTRAINT "_equipos_nuevos_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v" ADD CONSTRAINT "_equipos_nuevos_v_version_actualizado_por_id_users_id_fk" FOREIGN KEY ("version_actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v_rels" ADD CONSTRAINT "_equipos_nuevos_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_equipos_nuevos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_v_rels" ADD CONSTRAINT "_equipos_nuevos_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v" ADD CONSTRAINT "_equipos_usados_v_parent_id_equipos_usados_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipos_usados"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v" ADD CONSTRAINT "_equipos_usados_v_version_categoria_id_categorias_usada_id_fk" FOREIGN KEY ("version_categoria_id") REFERENCES "public"."categorias_usada"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v" ADD CONSTRAINT "_equipos_usados_v_version_marca_usada_id_marcas_usada_id_fk" FOREIGN KEY ("version_marca_usada_id") REFERENCES "public"."marcas_usada"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v" ADD CONSTRAINT "_equipos_usados_v_version_ficha_tecnica_pdf_id_documentos_id_fk" FOREIGN KEY ("version_ficha_tecnica_pdf_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v" ADD CONSTRAINT "_equipos_usados_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v" ADD CONSTRAINT "_equipos_usados_v_version_actualizado_por_id_users_id_fk" FOREIGN KEY ("version_actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v_rels" ADD CONSTRAINT "_equipos_usados_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_equipos_usados_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_usados_v_rels" ADD CONSTRAINT "_equipos_usados_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_modelos_repuesto_v_version_piezas_order_idx" ON "_modelos_repuesto_v_version_piezas" USING btree ("_order");
  CREATE INDEX "_modelos_repuesto_v_version_piezas_parent_id_idx" ON "_modelos_repuesto_v_version_piezas" USING btree ("_parent_id");
  CREATE INDEX "_modelos_repuesto_v_parent_idx" ON "_modelos_repuesto_v" USING btree ("parent_id");
  CREATE INDEX "_modelos_repuesto_v_version_version__modelos_repuesto_mo_idx" ON "_modelos_repuesto_v" USING btree ("version__modelos_repuesto_modelos_order");
  CREATE INDEX "_modelos_repuesto_v_version_version_marca_idx" ON "_modelos_repuesto_v" USING btree ("version_marca_id");
  CREATE INDEX "_modelos_repuesto_v_version_version_tipo_idx" ON "_modelos_repuesto_v" USING btree ("version_tipo_id");
  CREATE INDEX "_modelos_repuesto_v_version_seo_version_seo_og_image_idx" ON "_modelos_repuesto_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_modelos_repuesto_v_version_version_slug_idx" ON "_modelos_repuesto_v" USING btree ("version_slug");
  CREATE INDEX "_modelos_repuesto_v_version_version_actualizado_por_idx" ON "_modelos_repuesto_v" USING btree ("version_actualizado_por_id");
  CREATE INDEX "_modelos_repuesto_v_version_version_updated_at_idx" ON "_modelos_repuesto_v" USING btree ("version_updated_at");
  CREATE INDEX "_modelos_repuesto_v_version_version_created_at_idx" ON "_modelos_repuesto_v" USING btree ("version_created_at");
  CREATE INDEX "_modelos_repuesto_v_created_at_idx" ON "_modelos_repuesto_v" USING btree ("created_at");
  CREATE INDEX "_modelos_repuesto_v_updated_at_idx" ON "_modelos_repuesto_v" USING btree ("updated_at");
  CREATE INDEX "version_tipo_version_slug_idx" ON "_modelos_repuesto_v" USING btree ("version_tipo_id","version_slug");
  CREATE INDEX "_modelos_repuesto_v_rels_order_idx" ON "_modelos_repuesto_v_rels" USING btree ("order");
  CREATE INDEX "_modelos_repuesto_v_rels_parent_idx" ON "_modelos_repuesto_v_rels" USING btree ("parent_id");
  CREATE INDEX "_modelos_repuesto_v_rels_path_idx" ON "_modelos_repuesto_v_rels" USING btree ("path");
  CREATE INDEX "_modelos_repuesto_v_rels_media_id_idx" ON "_modelos_repuesto_v_rels" USING btree ("media_id");
  CREATE INDEX "_equipos_nuevos_v_version_ficha_tecnica_order_idx" ON "_equipos_nuevos_v_version_ficha_tecnica" USING btree ("_order");
  CREATE INDEX "_equipos_nuevos_v_version_ficha_tecnica_parent_id_idx" ON "_equipos_nuevos_v_version_ficha_tecnica" USING btree ("_parent_id");
  CREATE INDEX "_equipos_nuevos_v_version_destacados_order_idx" ON "_equipos_nuevos_v_version_destacados" USING btree ("_order");
  CREATE INDEX "_equipos_nuevos_v_version_destacados_parent_id_idx" ON "_equipos_nuevos_v_version_destacados" USING btree ("_parent_id");
  CREATE INDEX "_equipos_nuevos_v_parent_idx" ON "_equipos_nuevos_v" USING btree ("parent_id");
  CREATE INDEX "_equipos_nuevos_v_version_version__equipos_nuevos_equipo_idx" ON "_equipos_nuevos_v" USING btree ("version__equipos_nuevos_equipos_order");
  CREATE INDEX "_equipos_nuevos_v_version_version_marca_idx" ON "_equipos_nuevos_v" USING btree ("version_marca_id");
  CREATE INDEX "_equipos_nuevos_v_version_version_tipo_idx" ON "_equipos_nuevos_v" USING btree ("version_tipo_id");
  CREATE INDEX "_equipos_nuevos_v_version_version_ficha_tecnica_pdf_idx" ON "_equipos_nuevos_v" USING btree ("version_ficha_tecnica_pdf_id");
  CREATE INDEX "_equipos_nuevos_v_version_seo_version_seo_og_image_idx" ON "_equipos_nuevos_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_equipos_nuevos_v_version_version_slug_idx" ON "_equipos_nuevos_v" USING btree ("version_slug");
  CREATE INDEX "_equipos_nuevos_v_version_version__order_idx" ON "_equipos_nuevos_v" USING btree ("version__order");
  CREATE INDEX "_equipos_nuevos_v_version_version_actualizado_por_idx" ON "_equipos_nuevos_v" USING btree ("version_actualizado_por_id");
  CREATE INDEX "_equipos_nuevos_v_version_version_updated_at_idx" ON "_equipos_nuevos_v" USING btree ("version_updated_at");
  CREATE INDEX "_equipos_nuevos_v_version_version_created_at_idx" ON "_equipos_nuevos_v" USING btree ("version_created_at");
  CREATE INDEX "_equipos_nuevos_v_created_at_idx" ON "_equipos_nuevos_v" USING btree ("created_at");
  CREATE INDEX "_equipos_nuevos_v_updated_at_idx" ON "_equipos_nuevos_v" USING btree ("updated_at");
  CREATE INDEX "version_tipo_version_slug_1_idx" ON "_equipos_nuevos_v" USING btree ("version_tipo_id","version_slug");
  CREATE INDEX "_equipos_nuevos_v_rels_order_idx" ON "_equipos_nuevos_v_rels" USING btree ("order");
  CREATE INDEX "_equipos_nuevos_v_rels_parent_idx" ON "_equipos_nuevos_v_rels" USING btree ("parent_id");
  CREATE INDEX "_equipos_nuevos_v_rels_path_idx" ON "_equipos_nuevos_v_rels" USING btree ("path");
  CREATE INDEX "_equipos_nuevos_v_rels_media_id_idx" ON "_equipos_nuevos_v_rels" USING btree ("media_id");
  CREATE INDEX "_equipos_usados_v_parent_idx" ON "_equipos_usados_v" USING btree ("parent_id");
  CREATE INDEX "_equipos_usados_v_version_version_categoria_idx" ON "_equipos_usados_v" USING btree ("version_categoria_id");
  CREATE INDEX "_equipos_usados_v_version_version_marca_usada_idx" ON "_equipos_usados_v" USING btree ("version_marca_usada_id");
  CREATE INDEX "_equipos_usados_v_version_version_ficha_tecnica_pdf_idx" ON "_equipos_usados_v" USING btree ("version_ficha_tecnica_pdf_id");
  CREATE INDEX "_equipos_usados_v_version_seo_version_seo_og_image_idx" ON "_equipos_usados_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_equipos_usados_v_version_version_slug_idx" ON "_equipos_usados_v" USING btree ("version_slug");
  CREATE INDEX "_equipos_usados_v_version_version_actualizado_por_idx" ON "_equipos_usados_v" USING btree ("version_actualizado_por_id");
  CREATE INDEX "_equipos_usados_v_version_version_updated_at_idx" ON "_equipos_usados_v" USING btree ("version_updated_at");
  CREATE INDEX "_equipos_usados_v_version_version_created_at_idx" ON "_equipos_usados_v" USING btree ("version_created_at");
  CREATE INDEX "_equipos_usados_v_created_at_idx" ON "_equipos_usados_v" USING btree ("created_at");
  CREATE INDEX "_equipos_usados_v_updated_at_idx" ON "_equipos_usados_v" USING btree ("updated_at");
  CREATE INDEX "version_categoria_version_slug_idx" ON "_equipos_usados_v" USING btree ("version_categoria_id","version_slug");
  CREATE INDEX "_equipos_usados_v_rels_order_idx" ON "_equipos_usados_v_rels" USING btree ("order");
  CREATE INDEX "_equipos_usados_v_rels_parent_idx" ON "_equipos_usados_v_rels" USING btree ("parent_id");
  CREATE INDEX "_equipos_usados_v_rels_path_idx" ON "_equipos_usados_v_rels" USING btree ("path");
  CREATE INDEX "_equipos_usados_v_rels_media_id_idx" ON "_equipos_usados_v_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "_modelos_repuesto_v_version_piezas" CASCADE;
  DROP TABLE "_modelos_repuesto_v" CASCADE;
  DROP TABLE "_modelos_repuesto_v_rels" CASCADE;
  DROP TABLE "_equipos_nuevos_v_version_ficha_tecnica" CASCADE;
  DROP TABLE "_equipos_nuevos_v_version_destacados" CASCADE;
  DROP TABLE "_equipos_nuevos_v" CASCADE;
  DROP TABLE "_equipos_nuevos_v_rels" CASCADE;
  DROP TABLE "_equipos_usados_v" CASCADE;
  DROP TABLE "_equipos_usados_v_rels" CASCADE;
  DROP TYPE "public"."enum__equipos_nuevos_v_version_ficha_tecnica_icono";
  DROP TYPE "public"."enum__equipos_usados_v_version_pestana_portada";`)
}
