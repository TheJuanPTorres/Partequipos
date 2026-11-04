import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cabecera_enlaces" ALTER COLUMN "enlace" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Una fila oculta guardada sin enlace impediría volver a NOT NULL: se le pone
  // «/» (sigue oculta, «mostrar» no cambia) en lugar de borrarla.
  await db.execute(sql`
   UPDATE "cabecera_enlaces" SET "enlace" = '/' WHERE "enlace" IS NULL;
   ALTER TABLE "cabecera_enlaces" ALTER COLUMN "enlace" SET NOT NULL;`)
}
