import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sedes_lineas" ADD COLUMN "enlace_maps" varchar;
  ALTER TABLE "sedes_lineas" ADD COLUMN "coordenadas" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sedes_lineas" DROP COLUMN "enlace_maps";
  ALTER TABLE "sedes_lineas" DROP COLUMN "coordenadas";`)
}
