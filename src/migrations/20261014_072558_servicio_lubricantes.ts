import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * SERVICIO TÉCNICO Y LUBRICANTES ENI (2026-10-14, decisión de dirección;
 * docs/diseno/decisiones-servicio-lubricantes.md).
 *
 * ESQUEMA (generado): ancla en los bloques de página, bloques «Galería»,
 * «Vídeo de YouTube» y «Formulario de contacto»; grado, grupo, foto y ficha
 * en los productos de lubricante; imagen de cabecera de la marca.
 *
 * DATOS (SQL explícito, CLAUDE.md §3.5): el 301 de las 4 subpáginas de
 * lubricantes de WordPress a su ancla en la página de la marca. El destino
 * se guarda como lo normaliza la colección (`normalizarDestino`: sin barra
 * final y con el ancla). IDEMPOTENTE con ON CONFLICT ("desde") DO NOTHING; el
 * `down` borra solo estas filas con origen «migracion».
 */
const REDIRECTS = [
  ['/lubricantes/lubricantes-eni/auto-liviano', '/lubricantes/lubricantes-eni#auto-liviano'],
  ['/lubricantes/lubricantes-eni/auto-pesado', '/lubricantes/lubricantes-eni#auto-pesado'],
  ['/lubricantes/lubricantes-eni/engranajes', '/lubricantes/lubricantes-eni#engranajes'],
  ['/lubricantes/lubricantes-eni/motos-scooter', '/lubricantes/lubricantes-eni#motos-scooter'],
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_blocks_galeria_imagenes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_id" integer
  );
  
  CREATE TABLE "paginas_blocks_galeria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "paginas_blocks_video_youtube" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" jsonb,
  	"youtube" varchar,
  	"miniatura_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "paginas_blocks_formulario_contacto" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" varchar,
  	"boton_texto" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "marcas_lubricante" ADD COLUMN "imagen_cabecera_id" integer;
  ALTER TABLE "categorias_lubricante_productos" ADD COLUMN "grado" varchar;
  ALTER TABLE "categorias_lubricante_productos" ADD COLUMN "grupo" varchar;
  ALTER TABLE "categorias_lubricante_productos" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "categorias_lubricante_productos" ADD COLUMN "ficha_id" integer;
  ALTER TABLE "paginas_blocks_cabecera_video" ADD COLUMN "ancla" varchar;
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD COLUMN "ancla" varchar;
  ALTER TABLE "paginas_blocks_cifras" ADD COLUMN "ancla" varchar;
  ALTER TABLE "paginas_blocks_franja_marquee" ADD COLUMN "ancla" varchar;
  ALTER TABLE "paginas_blocks_tarjetas_exp" ADD COLUMN "ancla" varchar;
  ALTER TABLE "paginas_blocks_galeria_imagenes" ADD CONSTRAINT "paginas_blocks_galeria_imagenes_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_galeria_imagenes" ADD CONSTRAINT "paginas_blocks_galeria_imagenes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_blocks_galeria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_galeria" ADD CONSTRAINT "paginas_blocks_galeria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_video_youtube" ADD CONSTRAINT "paginas_blocks_video_youtube_miniatura_id_media_id_fk" FOREIGN KEY ("miniatura_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_video_youtube" ADD CONSTRAINT "paginas_blocks_video_youtube_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_formulario_contacto" ADD CONSTRAINT "paginas_blocks_formulario_contacto_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_galeria_imagenes_order_idx" ON "paginas_blocks_galeria_imagenes" USING btree ("_order");
  CREATE INDEX "paginas_blocks_galeria_imagenes_parent_id_idx" ON "paginas_blocks_galeria_imagenes" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_galeria_imagenes_imagen_idx" ON "paginas_blocks_galeria_imagenes" USING btree ("imagen_id");
  CREATE INDEX "paginas_blocks_galeria_order_idx" ON "paginas_blocks_galeria" USING btree ("_order");
  CREATE INDEX "paginas_blocks_galeria_parent_id_idx" ON "paginas_blocks_galeria" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_galeria_path_idx" ON "paginas_blocks_galeria" USING btree ("_path");
  CREATE INDEX "paginas_blocks_video_youtube_order_idx" ON "paginas_blocks_video_youtube" USING btree ("_order");
  CREATE INDEX "paginas_blocks_video_youtube_parent_id_idx" ON "paginas_blocks_video_youtube" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_video_youtube_path_idx" ON "paginas_blocks_video_youtube" USING btree ("_path");
  CREATE INDEX "paginas_blocks_video_youtube_miniatura_idx" ON "paginas_blocks_video_youtube" USING btree ("miniatura_id");
  CREATE INDEX "paginas_blocks_formulario_contacto_order_idx" ON "paginas_blocks_formulario_contacto" USING btree ("_order");
  CREATE INDEX "paginas_blocks_formulario_contacto_parent_id_idx" ON "paginas_blocks_formulario_contacto" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_formulario_contacto_path_idx" ON "paginas_blocks_formulario_contacto" USING btree ("_path");
  ALTER TABLE "marcas_lubricante" ADD CONSTRAINT "marcas_lubricante_imagen_cabecera_id_media_id_fk" FOREIGN KEY ("imagen_cabecera_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_lubricante_productos" ADD CONSTRAINT "categorias_lubricante_productos_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_lubricante_productos" ADD CONSTRAINT "categorias_lubricante_productos_ficha_id_documentos_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_lubricante_imagen_cabecera_idx" ON "marcas_lubricante" USING btree ("imagen_cabecera_id");
  CREATE INDEX "categorias_lubricante_productos_imagen_idx" ON "categorias_lubricante_productos" USING btree ("imagen_id");
  CREATE INDEX "categorias_lubricante_productos_ficha_idx" ON "categorias_lubricante_productos" USING btree ("ficha_id");`)
  for (const [desde, hacia] of REDIRECTS) {
    await db.execute(sql`
      INSERT INTO "redirects" ("desde", "hacia", "tipo", "origen", "estado_destino", "updated_at", "created_at")
      VALUES (${desde}, ${hacia}, '301', 'migracion', 'sin-verificar', now(), now())
      ON CONFLICT ("desde") DO NOTHING;`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const [desde, hacia] of REDIRECTS) {
    await db.execute(sql`
      DELETE FROM "redirects"
      WHERE "desde" = ${desde} AND "hacia" = ${hacia} AND "origen" = 'migracion';`)
  }
  await db.execute(sql`
   ALTER TABLE "paginas_blocks_galeria_imagenes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas_blocks_galeria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas_blocks_video_youtube" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas_blocks_formulario_contacto" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "paginas_blocks_galeria_imagenes" CASCADE;
  DROP TABLE "paginas_blocks_galeria" CASCADE;
  DROP TABLE "paginas_blocks_video_youtube" CASCADE;
  DROP TABLE "paginas_blocks_formulario_contacto" CASCADE;
  ALTER TABLE "marcas_lubricante" DROP CONSTRAINT "marcas_lubricante_imagen_cabecera_id_media_id_fk";
  
  ALTER TABLE "categorias_lubricante_productos" DROP CONSTRAINT "categorias_lubricante_productos_imagen_id_media_id_fk";
  
  ALTER TABLE "categorias_lubricante_productos" DROP CONSTRAINT "categorias_lubricante_productos_ficha_id_documentos_id_fk";
  
  DROP INDEX "marcas_lubricante_imagen_cabecera_idx";
  DROP INDEX "categorias_lubricante_productos_imagen_idx";
  DROP INDEX "categorias_lubricante_productos_ficha_idx";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "imagen_cabecera_id";
  ALTER TABLE "categorias_lubricante_productos" DROP COLUMN "grado";
  ALTER TABLE "categorias_lubricante_productos" DROP COLUMN "grupo";
  ALTER TABLE "categorias_lubricante_productos" DROP COLUMN "imagen_id";
  ALTER TABLE "categorias_lubricante_productos" DROP COLUMN "ficha_id";
  ALTER TABLE "paginas_blocks_cabecera_video" DROP COLUMN "ancla";
  ALTER TABLE "paginas_blocks_presentacion_imagen" DROP COLUMN "ancla";
  ALTER TABLE "paginas_blocks_cifras" DROP COLUMN "ancla";
  ALTER TABLE "paginas_blocks_franja_marquee" DROP COLUMN "ancla";
  ALTER TABLE "paginas_blocks_tarjetas_exp" DROP COLUMN "ancla";`)
}
