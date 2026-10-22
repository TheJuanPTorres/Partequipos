import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_indice_blog_diseno_articulo" AS ENUM('provisional', 'propio');
  CREATE TABLE "articulos_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categorias_tecnicas_id" integer,
  	"categorias_usada_id" integer,
  	"categorias_maquinaria_id" integer
  );
  
  ALTER TABLE "paginas_indice" ADD COLUMN "blog_diseno_articulo" "enum_paginas_indice_blog_diseno_articulo" DEFAULT 'provisional' NOT NULL;
  ALTER TABLE "articulos_rels" ADD CONSTRAINT "articulos_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."articulos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articulos_rels" ADD CONSTRAINT "articulos_rels_categorias_tecnicas_fk" FOREIGN KEY ("categorias_tecnicas_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articulos_rels" ADD CONSTRAINT "articulos_rels_categorias_usada_fk" FOREIGN KEY ("categorias_usada_id") REFERENCES "public"."categorias_usada"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articulos_rels" ADD CONSTRAINT "articulos_rels_categorias_maquinaria_fk" FOREIGN KEY ("categorias_maquinaria_id") REFERENCES "public"."categorias_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articulos_rels_order_idx" ON "articulos_rels" USING btree ("order");
  CREATE INDEX "articulos_rels_parent_idx" ON "articulos_rels" USING btree ("parent_id");
  CREATE INDEX "articulos_rels_path_idx" ON "articulos_rels" USING btree ("path");
  CREATE INDEX "articulos_rels_categorias_tecnicas_id_idx" ON "articulos_rels" USING btree ("categorias_tecnicas_id");
  CREATE INDEX "articulos_rels_categorias_usada_id_idx" ON "articulos_rels" USING btree ("categorias_usada_id");
  CREATE INDEX "articulos_rels_categorias_maquinaria_id_idx" ON "articulos_rels" USING btree ("categorias_maquinaria_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articulos_rels" CASCADE;
  ALTER TABLE "paginas_indice" DROP COLUMN "blog_diseno_articulo";
  DROP TYPE "public"."enum_paginas_indice_blog_diseno_articulo";`)
}
