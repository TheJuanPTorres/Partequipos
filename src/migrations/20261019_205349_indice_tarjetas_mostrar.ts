import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Casilla «Mostrar en la web» en las tarjetas de las páginas índice (cliente,
 * 2026-10-19: el índice de Repuestos solo con las dos primeras). Solo esquema;
 * las tarjetas que ya existen quedan marcadas por el DEFAULT, así que el sitio
 * no cambia hasta que se desmarquen en el panel.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice_repuestos_tarjetas" ADD COLUMN "mostrar" boolean DEFAULT true;
  ALTER TABLE "paginas_indice_maquinaria_tarjetas" ADD COLUMN "mostrar" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice_repuestos_tarjetas" DROP COLUMN "mostrar";
  ALTER TABLE "paginas_indice_maquinaria_tarjetas" DROP COLUMN "mostrar";`)
}
