import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * «Documento en visor» (2026-10-20): el bloque de página
 * (`paginas_blocks_documento_visor`) y las «Páginas como imágenes» de cada
 * documento (`documentos_rels`, hacia `media`). Solo esquema: las páginas las
 * sube `scripts/documentos/visor.ts`. El mismo bloque dentro del texto
 * enriquecido no necesita tablas (va en el JSON de Lexical).
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_blocks_documento_visor" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"documento_id" integer,
  	"titulo" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "documentos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "paginas_blocks_documento_visor" ADD CONSTRAINT "paginas_blocks_documento_visor_documento_id_documentos_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_documento_visor" ADD CONSTRAINT "paginas_blocks_documento_visor_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documentos_rels" ADD CONSTRAINT "documentos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."documentos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documentos_rels" ADD CONSTRAINT "documentos_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_documento_visor_order_idx" ON "paginas_blocks_documento_visor" USING btree ("_order");
  CREATE INDEX "paginas_blocks_documento_visor_parent_id_idx" ON "paginas_blocks_documento_visor" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_documento_visor_path_idx" ON "paginas_blocks_documento_visor" USING btree ("_path");
  CREATE INDEX "paginas_blocks_documento_visor_documento_idx" ON "paginas_blocks_documento_visor" USING btree ("documento_id");
  CREATE INDEX "documentos_rels_order_idx" ON "documentos_rels" USING btree ("order");
  CREATE INDEX "documentos_rels_parent_idx" ON "documentos_rels" USING btree ("parent_id");
  CREATE INDEX "documentos_rels_path_idx" ON "documentos_rels" USING btree ("path");
  CREATE INDEX "documentos_rels_media_id_idx" ON "documentos_rels" USING btree ("media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "paginas_blocks_documento_visor" CASCADE;
  DROP TABLE "documentos_rels" CASCADE;`)
}
