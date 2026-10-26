import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "categorias_tecnicas_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_bienvenida_antetitulo" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_bienvenida_titulo" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_bienvenida_texto" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_por_que_titulo" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_por_que_texto" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_por_que_imagen_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_compromiso_titulo" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "pagina_marca_compromiso_texto" varchar;
  ALTER TABLE "categorias_tecnicas_rels" ADD CONSTRAINT "categorias_tecnicas_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_tecnicas_rels" ADD CONSTRAINT "categorias_tecnicas_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_rels_order_idx" ON "categorias_tecnicas_rels" USING btree ("order");
  CREATE INDEX "categorias_tecnicas_rels_parent_idx" ON "categorias_tecnicas_rels" USING btree ("parent_id");
  CREATE INDEX "categorias_tecnicas_rels_path_idx" ON "categorias_tecnicas_rels" USING btree ("path");
  CREATE INDEX "categorias_tecnicas_rels_media_id_idx" ON "categorias_tecnicas_rels" USING btree ("media_id");
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_pagina_marca_por_que_imagen_id_media_id_fk" FOREIGN KEY ("pagina_marca_por_que_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_pagina_marca_pagina_marca_por_que_im_idx" ON "categorias_tecnicas" USING btree ("pagina_marca_por_que_imagen_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "categorias_tecnicas_rels" CASCADE;
  ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_pagina_marca_por_que_imagen_id_media_id_fk";
  
  DROP INDEX "categorias_tecnicas_pagina_marca_pagina_marca_por_que_im_idx";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_bienvenida_antetitulo";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_bienvenida_titulo";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_bienvenida_texto";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_por_que_titulo";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_por_que_texto";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_por_que_imagen_id";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_compromiso_titulo";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "pagina_marca_compromiso_texto";`)
}
