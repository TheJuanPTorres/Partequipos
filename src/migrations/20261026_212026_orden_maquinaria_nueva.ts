import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_nuevos" ADD COLUMN "orden" numeric;
  ALTER TABLE "tipos_maquinaria" ADD COLUMN "orden" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_nuevos" DROP COLUMN "orden";
  ALTER TABLE "tipos_maquinaria" DROP COLUMN "orden";`)
}
