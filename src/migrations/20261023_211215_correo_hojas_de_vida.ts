import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_correo_hojas_de_vida" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_correo_hojas_de_vida";`)
}
