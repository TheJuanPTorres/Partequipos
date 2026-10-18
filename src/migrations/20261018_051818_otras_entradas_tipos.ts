import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * «Otras entradas de la lista de modelos» en `tipos-equipo` (2026-10-17,
 * decisión del cliente: las listas de WordPress, tal cual). Solo esquema: los
 * datos los pone `scripts/repuestos/entradas-wp.ts`.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tipos_equipo_otras_entradas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL,
  	"serie" varchar,
  	"modelo_id" integer
  );
  
  ALTER TABLE "tipos_equipo_otras_entradas" ADD CONSTRAINT "tipos_equipo_otras_entradas_modelo_id_modelos_repuesto_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelos_repuesto"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_equipo_otras_entradas" ADD CONSTRAINT "tipos_equipo_otras_entradas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tipos_equipo_otras_entradas_order_idx" ON "tipos_equipo_otras_entradas" USING btree ("_order");
  CREATE INDEX "tipos_equipo_otras_entradas_parent_id_idx" ON "tipos_equipo_otras_entradas" USING btree ("_parent_id");
  CREATE INDEX "tipos_equipo_otras_entradas_modelo_idx" ON "tipos_equipo_otras_entradas" USING btree ("modelo_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "tipos_equipo_otras_entradas" CASCADE;`)
}
