import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_categorias_tecnicas_icono" AS ENUM('corte', 'llanta', 'lubricante', 'filtro', 'motor', 'rodaje');
  CREATE TABLE "paginas_hero_diapositivas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"parrafo" varchar,
  	"imagen_fondo_id" integer,
  	"imagen_frontal_id" integer,
  	"enlace" varchar,
  	"enlace_nombre" varchar
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"descripcion" varchar NOT NULL,
  	"poster_id" integer NOT NULL,
  	"decorativo" boolean DEFAULT true,
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
  
  CREATE TABLE "sedes_lineas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"linea" varchar NOT NULL,
  	"localidad" varchar,
  	"direccion" varchar NOT NULL
  );
  
  CREATE TABLE "sedes_telefonos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"numero" varchar NOT NULL
  );
  
  CREATE TABLE "sedes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"latitud" numeric NOT NULL,
  	"longitud" numeric NOT NULL,
  	"foto_id" integer,
  	"orden" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"empresa" varchar,
  	"ciudad" varchar,
  	"cita" varchar NOT NULL,
  	"foto_id" integer,
  	"video_id" integer,
  	"autorizacion_uso" boolean DEFAULT false,
  	"fecha_autorizacion" timestamp(3) with time zone,
  	"referencia_autorizacion" varchar,
  	"publicado" boolean DEFAULT false,
  	"orden" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "preguntas_frecuentes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pregunta" varchar NOT NULL,
  	"respuesta" varchar NOT NULL,
  	"orden" numeric,
  	"publicada" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "icono" "enum_categorias_tecnicas_icono";
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "enlace" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "imagen_tarjeta_id" integer;
  ALTER TABLE "equipos_usados" ADD COLUMN "peso_operativo" numeric;
  ALTER TABLE "equipos_usados" ADD COLUMN "potencia" numeric;
  ALTER TABLE "equipos_usados" ADD COLUMN "motor" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "videos_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sedes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "testimonios_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "preguntas_frecuentes_id" integer;
  ALTER TABLE "paginas_hero_diapositivas" ADD CONSTRAINT "paginas_hero_diapositivas_imagen_fondo_id_media_id_fk" FOREIGN KEY ("imagen_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_hero_diapositivas" ADD CONSTRAINT "paginas_hero_diapositivas_imagen_frontal_id_media_id_fk" FOREIGN KEY ("imagen_frontal_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_hero_diapositivas" ADD CONSTRAINT "paginas_hero_diapositivas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sedes_lineas" ADD CONSTRAINT "sedes_lineas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sedes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sedes_telefonos" ADD CONSTRAINT "sedes_telefonos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sedes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sedes" ADD CONSTRAINT "sedes_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_hero_diapositivas_order_idx" ON "paginas_hero_diapositivas" USING btree ("_order");
  CREATE INDEX "paginas_hero_diapositivas_parent_id_idx" ON "paginas_hero_diapositivas" USING btree ("_parent_id");
  CREATE INDEX "paginas_hero_diapositivas_imagen_fondo_idx" ON "paginas_hero_diapositivas" USING btree ("imagen_fondo_id");
  CREATE INDEX "paginas_hero_diapositivas_imagen_frontal_idx" ON "paginas_hero_diapositivas" USING btree ("imagen_frontal_id");
  CREATE INDEX "videos_poster_idx" ON "videos" USING btree ("poster_id");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_filename_idx" ON "videos" USING btree ("filename");
  CREATE INDEX "sedes_lineas_order_idx" ON "sedes_lineas" USING btree ("_order");
  CREATE INDEX "sedes_lineas_parent_id_idx" ON "sedes_lineas" USING btree ("_parent_id");
  CREATE INDEX "sedes_telefonos_order_idx" ON "sedes_telefonos" USING btree ("_order");
  CREATE INDEX "sedes_telefonos_parent_id_idx" ON "sedes_telefonos" USING btree ("_parent_id");
  CREATE INDEX "sedes_foto_idx" ON "sedes" USING btree ("foto_id");
  CREATE INDEX "sedes_updated_at_idx" ON "sedes" USING btree ("updated_at");
  CREATE INDEX "sedes_created_at_idx" ON "sedes" USING btree ("created_at");
  CREATE INDEX "testimonios_foto_idx" ON "testimonios" USING btree ("foto_id");
  CREATE INDEX "testimonios_video_idx" ON "testimonios" USING btree ("video_id");
  CREATE INDEX "testimonios_updated_at_idx" ON "testimonios" USING btree ("updated_at");
  CREATE INDEX "testimonios_created_at_idx" ON "testimonios" USING btree ("created_at");
  CREATE INDEX "preguntas_frecuentes_updated_at_idx" ON "preguntas_frecuentes" USING btree ("updated_at");
  CREATE INDEX "preguntas_frecuentes_created_at_idx" ON "preguntas_frecuentes" USING btree ("created_at");
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_imagen_tarjeta_id_media_id_fk" FOREIGN KEY ("imagen_tarjeta_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sedes_fk" FOREIGN KEY ("sedes_id") REFERENCES "public"."sedes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonios_fk" FOREIGN KEY ("testimonios_id") REFERENCES "public"."testimonios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_preguntas_frecuentes_fk" FOREIGN KEY ("preguntas_frecuentes_id") REFERENCES "public"."preguntas_frecuentes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_imagen_idx" ON "categorias_tecnicas" USING btree ("imagen_id");
  CREATE INDEX "marcas_maquinaria_imagen_tarjeta_idx" ON "marcas_maquinaria" USING btree ("imagen_tarjeta_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");
  CREATE INDEX "payload_locked_documents_rels_sedes_id_idx" ON "payload_locked_documents_rels" USING btree ("sedes_id");
  CREATE INDEX "payload_locked_documents_rels_testimonios_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonios_id");
  CREATE INDEX "payload_locked_documents_rels_preguntas_frecuentes_id_idx" ON "payload_locked_documents_rels" USING btree ("preguntas_frecuentes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_hero_diapositivas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sedes_lineas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sedes_telefonos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sedes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "testimonios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "preguntas_frecuentes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "paginas_hero_diapositivas" CASCADE;
  DROP TABLE "videos" CASCADE;
  DROP TABLE "sedes_lineas" CASCADE;
  DROP TABLE "sedes_telefonos" CASCADE;
  DROP TABLE "sedes" CASCADE;
  DROP TABLE "testimonios" CASCADE;
  DROP TABLE "preguntas_frecuentes" CASCADE;
  ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_imagen_id_media_id_fk";
  
  ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_imagen_tarjeta_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_videos_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sedes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonios_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_preguntas_frecuentes_fk";
  
  DROP INDEX "categorias_tecnicas_imagen_idx";
  DROP INDEX "marcas_maquinaria_imagen_tarjeta_idx";
  DROP INDEX "payload_locked_documents_rels_videos_id_idx";
  DROP INDEX "payload_locked_documents_rels_sedes_id_idx";
  DROP INDEX "payload_locked_documents_rels_testimonios_id_idx";
  DROP INDEX "payload_locked_documents_rels_preguntas_frecuentes_id_idx";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "imagen_id";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "icono";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "enlace";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "imagen_tarjeta_id";
  ALTER TABLE "equipos_usados" DROP COLUMN "peso_operativo";
  ALTER TABLE "equipos_usados" DROP COLUMN "potencia";
  ALTER TABLE "equipos_usados" DROP COLUMN "motor";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "videos_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sedes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "testimonios_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "preguntas_frecuentes_id";
  DROP TYPE "public"."enum_categorias_tecnicas_icono";`)
}
