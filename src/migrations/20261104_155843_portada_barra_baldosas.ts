import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_barra_secciones_botones_ancla" AS ENUM('nueva', 'maquinaria-usada', 'repuestos');
  CREATE TABLE "paginas_barra_secciones_botones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar,
  	"ancla" "enum_paginas_barra_secciones_botones_ancla",
  	"imagen_id" integer
  );
  
  ALTER TABLE "marcas" ADD COLUMN "color_baldosa" varchar;
  ALTER TABLE "marcas" ADD COLUMN "logo_baldosa_id" integer;
  ALTER TABLE "paginas_barra_secciones_botones" ADD CONSTRAINT "paginas_barra_secciones_botones_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_barra_secciones_botones" ADD CONSTRAINT "paginas_barra_secciones_botones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_barra_secciones_botones_order_idx" ON "paginas_barra_secciones_botones" USING btree ("_order");
  CREATE INDEX "paginas_barra_secciones_botones_parent_id_idx" ON "paginas_barra_secciones_botones" USING btree ("_parent_id");
  CREATE INDEX "paginas_barra_secciones_botones_imagen_idx" ON "paginas_barra_secciones_botones" USING btree ("imagen_id");
  ALTER TABLE "marcas" ADD CONSTRAINT "marcas_logo_baldosa_id_media_id_fk" FOREIGN KEY ("logo_baldosa_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_logo_baldosa_idx" ON "marcas" USING btree ("logo_baldosa_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_barra_secciones_botones" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "paginas_barra_secciones_botones" CASCADE;
  ALTER TABLE "marcas" DROP CONSTRAINT "marcas_logo_baldosa_id_media_id_fk";
  
  DROP INDEX "marcas_logo_baldosa_idx";
  ALTER TABLE "marcas" DROP COLUMN "color_baldosa";
  ALTER TABLE "marcas" DROP COLUMN "logo_baldosa_id";
  DROP TYPE "public"."enum_paginas_barra_secciones_botones_ancla";`)
}
