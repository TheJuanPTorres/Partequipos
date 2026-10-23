import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto" ADD COLUMN "mostrar_en_web" boolean DEFAULT true;
  ALTER TABLE "equipos_nuevos" ADD COLUMN "mostrar_en_web" boolean DEFAULT true;
  ALTER TABLE "equipos_usados" ADD COLUMN "mostrar_en_web" boolean DEFAULT true;
  ALTER TABLE "categorias_lubricante_productos" ADD COLUMN "mostrar_en_web" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto" DROP COLUMN "mostrar_en_web";
  ALTER TABLE "equipos_nuevos" DROP COLUMN "mostrar_en_web";
  ALTER TABLE "equipos_usados" DROP COLUMN "mostrar_en_web";
  ALTER TABLE "categorias_lubricante_productos" DROP COLUMN "mostrar_en_web";`)
}
