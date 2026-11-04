import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_titulo_resaltado" varchar DEFAULT 'Repuestos';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_whatsapp_texto" varchar DEFAULT 'Encuentra la referencia que tu máquina necesita';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_whatsapp_mensaje" varchar DEFAULT 'Hola, busco la referencia de un repuesto para mi máquina.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_titulo_resaltado";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_whatsapp_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_whatsapp_mensaje";`)
}
