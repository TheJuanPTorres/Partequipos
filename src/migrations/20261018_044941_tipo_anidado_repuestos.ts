import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Tipo anidado de repuestos (2026-10-17, dirección): «Cuelga de» (`tipo_padre_id`)
 * y el slug del padre desnormalizado (`slug_padre`) en `tipos_equipo`, para la
 * «Excavadora» de CASE bajo «Cargador frontal» (src/lib/repuestos/anidado.ts).
 * Solo esquema: los datos los pone `scripts/repuestos/tipo-anidado.ts`.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tipos_equipo" ADD COLUMN "tipo_padre_id" integer;
  ALTER TABLE "tipos_equipo" ADD COLUMN "slug_padre" varchar;
  ALTER TABLE "tipos_equipo" ADD CONSTRAINT "tipos_equipo_tipo_padre_id_tipos_equipo_id_fk" FOREIGN KEY ("tipo_padre_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "tipos_equipo_tipo_padre_idx" ON "tipos_equipo" USING btree ("tipo_padre_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tipos_equipo" DROP CONSTRAINT IF EXISTS "tipos_equipo_tipo_padre_id_tipos_equipo_id_fk";
  
  DROP INDEX IF EXISTS "tipos_equipo_tipo_padre_idx";
  ALTER TABLE "tipos_equipo" DROP COLUMN IF EXISTS "tipo_padre_id";
  ALTER TABLE "tipos_equipo" DROP COLUMN IF EXISTS "slug_padre";`)
}
