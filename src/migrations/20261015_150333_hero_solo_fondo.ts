import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "mostrar_titulo" boolean DEFAULT true;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "mostrar_texto_circular" boolean DEFAULT true;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "mostrar_descripcion" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "mostrar_titulo";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "mostrar_texto_circular";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "mostrar_descripcion";`)
}
