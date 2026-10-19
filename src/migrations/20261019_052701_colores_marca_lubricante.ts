import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Colores de la marca de lubricantes (2026-10-19, cliente): su página es un «sitio dentro del
 * sitio» con la identidad de la marca. Dos columnas opcionales y, con SQL explícito (CLAUDE.md
 * §3.5), el amarillo y el negro de ENI. El amarillo es el de la marca (Pantone 109 C, ≈ #FFD100):
 * valor aproximado, sin hex oficial publicado; el cliente lo ajusta desde el panel.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" ADD COLUMN "color_principal" varchar;
  ALTER TABLE "marcas_lubricante" ADD COLUMN "color_oscuro" varchar;
  UPDATE "marcas_lubricante" SET "color_principal" = '#ffd100', "color_oscuro" = '#111111'
    WHERE "slug" = 'lubricantes-eni';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_lubricante" DROP COLUMN IF EXISTS "color_principal";
  ALTER TABLE "marcas_lubricante" DROP COLUMN IF EXISTS "color_oscuro";`)
}
