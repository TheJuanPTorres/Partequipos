/*
 * PRUEBA A PROPÓSITO: migración rota para demostrar que el job «Migrar desde
 * cero» falla. Esta rama NO se fusiona. `1/0` falla en cualquier base y la
 * migración va en transacción: no deja nada aplicado.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`SELECT 1/0`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`SELECT 1`);
}
