import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solicitudes" ADD COLUMN "autorizacion_datos" boolean;
  ALTER TABLE "solicitudes" ADD COLUMN "autorizacion_texto" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solicitudes" DROP COLUMN "autorizacion_datos";
  ALTER TABLE "solicitudes" DROP COLUMN "autorizacion_texto";`)
}
