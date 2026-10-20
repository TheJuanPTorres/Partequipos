import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_linea_intro" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_linea_cierre" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_linea_intro";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_linea_cierre";`)
}
