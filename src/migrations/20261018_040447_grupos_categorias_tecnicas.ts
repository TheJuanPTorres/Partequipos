import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "categorias_tecnicas_grupos_productos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL
  );
  
  CREATE TABLE "categorias_tecnicas_grupos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"mostrar" boolean DEFAULT true,
  	"imagen_id" integer
  );
  
  ALTER TABLE "categorias_tecnicas_grupos_productos" ADD CONSTRAINT "categorias_tecnicas_grupos_productos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categorias_tecnicas_grupos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias_tecnicas_grupos" ADD CONSTRAINT "categorias_tecnicas_grupos_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_tecnicas_grupos" ADD CONSTRAINT "categorias_tecnicas_grupos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_grupos_productos_order_idx" ON "categorias_tecnicas_grupos_productos" USING btree ("_order");
  CREATE INDEX "categorias_tecnicas_grupos_productos_parent_id_idx" ON "categorias_tecnicas_grupos_productos" USING btree ("_parent_id");
  CREATE INDEX "categorias_tecnicas_grupos_order_idx" ON "categorias_tecnicas_grupos" USING btree ("_order");
  CREATE INDEX "categorias_tecnicas_grupos_parent_id_idx" ON "categorias_tecnicas_grupos" USING btree ("_parent_id");
  CREATE INDEX "categorias_tecnicas_grupos_imagen_idx" ON "categorias_tecnicas_grupos" USING btree ("imagen_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "categorias_tecnicas_grupos_productos" CASCADE;
  DROP TABLE "categorias_tecnicas_grupos" CASCADE;`)
}
