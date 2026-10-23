import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_usados" ADD COLUMN "serial" varchar;
  ALTER TABLE "equipos_usados" ADD COLUMN "descripcion_corta" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_usados" DROP COLUMN "serial";
  ALTER TABLE "equipos_usados" DROP COLUMN "descripcion_corta";`)
}
