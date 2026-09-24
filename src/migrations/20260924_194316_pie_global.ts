/*
 * GLOBAL `pie` (docs/diseno/decisiones-home-ux9.md §13).
 *
 * DECISIÓN DE DATOS, no solo de esquema (CLAUDE.md §10.17): además de crear las
 * tablas, SIEMBRA el contenido que el pie tenía en el código (`PIE_INICIAL`).
 * Sin esto, el pie de TODAS las páginas quedaría vacío al desplegar, hasta que
 * alguien lo rellenara en el panel. No pisa nada: la tabla es nueva.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { PIE_INICIAL } from '../lib/pie'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pie_columnas_enlaces_tipo" AS ENUM('pagina', 'telefono');
  CREATE TABLE "pie_columnas_enlaces" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"tipo" "enum_pie_columnas_enlaces_tipo" DEFAULT 'pagina' NOT NULL,
  	"destino" varchar
  );
  
  CREATE TABLE "pie_columnas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL
  );
  
  CREATE TABLE "pie" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lema" varchar NOT NULL,
  	"texto_boton" varchar NOT NULL,
  	"empresa_titulo" varchar,
  	"empresa_texto" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pie_columnas_enlaces" ADD CONSTRAINT "pie_columnas_enlaces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pie_columnas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pie_columnas" ADD CONSTRAINT "pie_columnas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pie"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pie_columnas_enlaces_order_idx" ON "pie_columnas_enlaces" USING btree ("_order");
  CREATE INDEX "pie_columnas_enlaces_parent_id_idx" ON "pie_columnas_enlaces" USING btree ("_parent_id");
  CREATE INDEX "pie_columnas_order_idx" ON "pie_columnas" USING btree ("_order");
  CREATE INDEX "pie_columnas_parent_id_idx" ON "pie_columnas" USING btree ("_parent_id");`)

  await payload.updateGlobal({ slug: 'pie', data: PIE_INICIAL, req })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pie_columnas_enlaces" CASCADE;
  DROP TABLE "pie_columnas" CASCADE;
  DROP TABLE "pie" CASCADE;
  DROP TYPE "public"."enum_pie_columnas_enlaces_tipo";`)
}
