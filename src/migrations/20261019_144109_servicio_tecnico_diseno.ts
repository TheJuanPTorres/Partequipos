import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_diseno" AS ENUM('bloques', 'servicioTecnico');
  CREATE TABLE "paginas_blocks_proceso_pasos_pasos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar,
  	"texto" varchar
  );
  
  CREATE TABLE "paginas_blocks_proceso_pasos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"entradilla" varchar,
  	"boton_texto" varchar,
  	"boton_enlace" varchar,
  	"textura_id" integer,
  	"block_name" varchar
  );
  
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD COLUMN "textura_id" integer;
  ALTER TABLE "paginas_blocks_galeria" ADD COLUMN "texto" varchar;
  ALTER TABLE "paginas_blocks_video_youtube" ADD COLUMN "video_taller_id" integer;
  ALTER TABLE "paginas_blocks_video_youtube" ADD COLUMN "video_fondo_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "diseno" "enum_paginas_diseno" DEFAULT 'bloques';
  ALTER TABLE "paginas_blocks_proceso_pasos_pasos" ADD CONSTRAINT "paginas_blocks_proceso_pasos_pasos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_blocks_proceso_pasos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_proceso_pasos" ADD CONSTRAINT "paginas_blocks_proceso_pasos_textura_id_media_id_fk" FOREIGN KEY ("textura_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_proceso_pasos" ADD CONSTRAINT "paginas_blocks_proceso_pasos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_proceso_pasos_pasos_order_idx" ON "paginas_blocks_proceso_pasos_pasos" USING btree ("_order");
  CREATE INDEX "paginas_blocks_proceso_pasos_pasos_parent_id_idx" ON "paginas_blocks_proceso_pasos_pasos" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_proceso_pasos_order_idx" ON "paginas_blocks_proceso_pasos" USING btree ("_order");
  CREATE INDEX "paginas_blocks_proceso_pasos_parent_id_idx" ON "paginas_blocks_proceso_pasos" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_proceso_pasos_path_idx" ON "paginas_blocks_proceso_pasos" USING btree ("_path");
  CREATE INDEX "paginas_blocks_proceso_pasos_textura_idx" ON "paginas_blocks_proceso_pasos" USING btree ("textura_id");
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD CONSTRAINT "paginas_blocks_presentacion_imagen_textura_id_media_id_fk" FOREIGN KEY ("textura_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_video_youtube" ADD CONSTRAINT "paginas_blocks_video_youtube_video_taller_id_videos_id_fk" FOREIGN KEY ("video_taller_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_video_youtube" ADD CONSTRAINT "paginas_blocks_video_youtube_video_fondo_id_videos_id_fk" FOREIGN KEY ("video_fondo_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_blocks_presentacion_imagen_textura_idx" ON "paginas_blocks_presentacion_imagen" USING btree ("textura_id");
  CREATE INDEX "paginas_blocks_video_youtube_video_taller_idx" ON "paginas_blocks_video_youtube" USING btree ("video_taller_id");
  CREATE INDEX "paginas_blocks_video_youtube_video_fondo_idx" ON "paginas_blocks_video_youtube" USING btree ("video_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_blocks_proceso_pasos_pasos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas_blocks_proceso_pasos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "paginas_blocks_proceso_pasos_pasos" CASCADE;
  DROP TABLE "paginas_blocks_proceso_pasos" CASCADE;
  ALTER TABLE "paginas_blocks_presentacion_imagen" DROP CONSTRAINT "paginas_blocks_presentacion_imagen_textura_id_media_id_fk";
  
  ALTER TABLE "paginas_blocks_video_youtube" DROP CONSTRAINT "paginas_blocks_video_youtube_video_taller_id_videos_id_fk";
  
  ALTER TABLE "paginas_blocks_video_youtube" DROP CONSTRAINT "paginas_blocks_video_youtube_video_fondo_id_videos_id_fk";
  
  DROP INDEX "paginas_blocks_presentacion_imagen_textura_idx";
  DROP INDEX "paginas_blocks_video_youtube_video_taller_idx";
  DROP INDEX "paginas_blocks_video_youtube_video_fondo_idx";
  ALTER TABLE "paginas_blocks_presentacion_imagen" DROP COLUMN "textura_id";
  ALTER TABLE "paginas_blocks_galeria" DROP COLUMN "texto";
  ALTER TABLE "paginas_blocks_video_youtube" DROP COLUMN "video_taller_id";
  ALTER TABLE "paginas_blocks_video_youtube" DROP COLUMN "video_fondo_id";
  ALTER TABLE "paginas" DROP COLUMN "diseno";
  DROP TYPE "public"."enum_paginas_diseno";`)
}
