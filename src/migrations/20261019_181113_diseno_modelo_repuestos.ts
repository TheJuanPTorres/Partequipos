import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Interruptor «Diseño de las páginas de modelo» del global epuestos-marca
 * (dirección, 2026-10-19: en el sitio publicado solo diseños de Andrés). Solo
 * esquema; la fila existente queda en 'provisional' por el DEFAULT.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_repuestos_marca_diseno_modelo" AS ENUM('provisional', 'propio');
  ALTER TABLE "repuestos_marca" ADD COLUMN "diseno_modelo" "enum_repuestos_marca_diseno_modelo" DEFAULT 'provisional' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "repuestos_marca" DROP COLUMN "diseno_modelo";
  DROP TYPE "public"."enum_repuestos_marca_diseno_modelo";`)
}
