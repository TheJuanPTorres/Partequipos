import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto" ADD COLUMN "enlace_tienda" varchar;
  ALTER TABLE "_modelos_repuesto_v" ADD COLUMN "version_enlace_tienda" varchar;
  ALTER TABLE "categorias_tecnicas_grupos_productos" ADD COLUMN "enlace_tienda" varchar;
  ALTER TABLE "categorias_tecnicas_grupos" ADD COLUMN "enlace_tienda" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "enlace_tienda" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto" DROP COLUMN "enlace_tienda";
  ALTER TABLE "_modelos_repuesto_v" DROP COLUMN "version_enlace_tienda";
  ALTER TABLE "categorias_tecnicas_grupos_productos" DROP COLUMN "enlace_tienda";
  ALTER TABLE "categorias_tecnicas_grupos" DROP COLUMN "enlace_tienda";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "enlace_tienda";`)
}
