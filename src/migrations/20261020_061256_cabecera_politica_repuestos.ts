import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * «Política de garantías y repuestos» del megamenú de Repuestos, editable en el
 * global `cabecera` (dirección, 2026-10-20). Solo esquema: los DEFAULT dejan la
 * fila que ya existe con la entrada visible y enlazada a la política publicada,
 * sin tocar el panel.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cabecera" ADD COLUMN "politica_repuestos_mostrar" boolean DEFAULT true;
  ALTER TABLE "cabecera" ADD COLUMN "politica_repuestos_texto" varchar DEFAULT 'Política de garantías y repuestos';
  ALTER TABLE "cabecera" ADD COLUMN "politica_repuestos_enlace" varchar DEFAULT '/politica-de-garantia-de-repuestos/';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cabecera" DROP COLUMN "politica_repuestos_mostrar";
  ALTER TABLE "cabecera" DROP COLUMN "politica_repuestos_texto";
  ALTER TABLE "cabecera" DROP COLUMN "politica_repuestos_enlace";`)
}
