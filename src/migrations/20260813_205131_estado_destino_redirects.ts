import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_redirects_estado_destino" AS ENUM('sin-verificar', 'resuelve', 'sin-contenido', 'sin-ruta', 'externa');
  ALTER TABLE "redirects" ADD COLUMN "estado_destino" "enum_redirects_estado_destino" DEFAULT 'sin-verificar';
  ALTER TABLE "redirects" ADD COLUMN "destino_verificado_en" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "redirects" DROP COLUMN "estado_destino";
  ALTER TABLE "redirects" DROP COLUMN "destino_verificado_en";
  DROP TYPE "public"."enum_redirects_estado_destino";`)
}
