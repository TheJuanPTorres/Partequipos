import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * FASE G (2026-10-02). `ciudad` y `departamento` son NOT NULL sin valor por
 * defecto: solo se pueden añadir a una tabla VACÍA. Comprobado: `sedes` tenía
 * 0 filas en preview y producción (y `sedes_telefonos` también, de ahí que se
 * pueda borrar). Si una base tuviera sedes, la migración fallaría entera (va en
 * transacción) y habría que darles valor antes.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "sedes_telefonos" CASCADE;
  ALTER TABLE "sedes_lineas" ADD COLUMN "telefono" varchar;
  ALTER TABLE "sedes" ADD COLUMN "ciudad" varchar NOT NULL;
  ALTER TABLE "sedes" ADD COLUMN "departamento" varchar NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sedes_telefonos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"numero" varchar NOT NULL
  );
  
  ALTER TABLE "sedes_telefonos" ADD CONSTRAINT "sedes_telefonos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sedes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sedes_telefonos_order_idx" ON "sedes_telefonos" USING btree ("_order");
  CREATE INDEX "sedes_telefonos_parent_id_idx" ON "sedes_telefonos" USING btree ("_parent_id");
  ALTER TABLE "sedes_lineas" DROP COLUMN "telefono";
  ALTER TABLE "sedes" DROP COLUMN "ciudad";
  ALTER TABLE "sedes" DROP COLUMN "departamento";`)
}
