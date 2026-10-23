import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// IF NOT EXISTS: se regeneró sobre main (entró 20261023_213120) y el preview ya tenía la columna
// de la versión anterior de esta migración. En una base nueva o en producción, añade la columna.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" ADD COLUMN IF NOT EXISTS "trabaja_correo_hojas_de_vida" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP COLUMN IF EXISTS "trabaja_correo_hojas_de_vida";`)
}
