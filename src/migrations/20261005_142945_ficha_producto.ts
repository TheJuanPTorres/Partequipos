import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_equipos_nuevos_ficha_tecnica_icono" AS ENUM('peso', 'potencia', 'motor', 'capacidad', 'alcance', 'profundidad', 'velocidad', 'otro');
  CREATE TABLE "documentos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "ficha_producto" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"imagen_contacto_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "equipos_nuevos_ficha_tecnica" ADD COLUMN "destacar" boolean DEFAULT false;
  ALTER TABLE "equipos_nuevos_ficha_tecnica" ADD COLUMN "icono" "enum_equipos_nuevos_ficha_tecnica_icono";
  ALTER TABLE "equipos_nuevos" ADD COLUMN "ficha_tecnica_pdf_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "documentos_id" integer;
  ALTER TABLE "ficha_producto" ADD CONSTRAINT "ficha_producto_imagen_contacto_id_media_id_fk" FOREIGN KEY ("imagen_contacto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "documentos_updated_at_idx" ON "documentos" USING btree ("updated_at");
  CREATE INDEX "documentos_created_at_idx" ON "documentos" USING btree ("created_at");
  CREATE UNIQUE INDEX "documentos_filename_idx" ON "documentos" USING btree ("filename");
  CREATE INDEX "ficha_producto_imagen_contacto_idx" ON "ficha_producto" USING btree ("imagen_contacto_id");
  ALTER TABLE "equipos_nuevos" ADD CONSTRAINT "equipos_nuevos_ficha_tecnica_pdf_id_documentos_id_fk" FOREIGN KEY ("ficha_tecnica_pdf_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documentos_fk" FOREIGN KEY ("documentos_id") REFERENCES "public"."documentos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "equipos_nuevos_ficha_tecnica_pdf_idx" ON "equipos_nuevos" USING btree ("ficha_tecnica_pdf_id");
  CREATE INDEX "payload_locked_documents_rels_documentos_id_idx" ON "payload_locked_documents_rels" USING btree ("documentos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_nuevos" DROP CONSTRAINT "equipos_nuevos_ficha_tecnica_pdf_id_documentos_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_documentos_fk";
  ALTER TABLE "documentos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ficha_producto" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "documentos" CASCADE;
  DROP TABLE "ficha_producto" CASCADE;
  DROP INDEX "equipos_nuevos_ficha_tecnica_pdf_idx";
  DROP INDEX "payload_locked_documents_rels_documentos_id_idx";
  ALTER TABLE "equipos_nuevos_ficha_tecnica" DROP COLUMN "destacar";
  ALTER TABLE "equipos_nuevos_ficha_tecnica" DROP COLUMN "icono";
  ALTER TABLE "equipos_nuevos" DROP COLUMN "ficha_tecnica_pdf_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "documentos_id";
  DROP TYPE "public"."enum_equipos_nuevos_ficha_tecnica_icono";`)
}
