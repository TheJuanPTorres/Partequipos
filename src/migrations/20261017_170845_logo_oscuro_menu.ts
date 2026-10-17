import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Casilla «Pintar el logo en oscuro en el menú» en las marcas de repuestos y de
 * maquinaria nueva (2026-10-17, dirección). Desmarcada por defecto: el logo sale
 * con sus colores. Se MARCA solo en las marcas cuyo logo es uno de los blancos
 * de WordPress (`wp-logo-…`, los de repuestos), para que sigan viéndose sobre
 * el submenú blanco. SQL explícito, sin la API local (CLAUDE.md §3.5).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas" ADD COLUMN "logo_oscuro_en_menu" boolean DEFAULT false;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "logo_oscuro_en_menu" boolean DEFAULT false;
  UPDATE "marcas" SET "logo_oscuro_en_menu" = true
    WHERE "logo_id" IN (SELECT "id" FROM "media" WHERE "filename" LIKE 'wp-logo-%');
  UPDATE "marcas_maquinaria" SET "logo_oscuro_en_menu" = true
    WHERE "logo_id" IN (SELECT "id" FROM "media" WHERE "filename" LIKE 'wp-logo-%');`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas" DROP COLUMN IF EXISTS "logo_oscuro_en_menu";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN IF EXISTS "logo_oscuro_en_menu";`)
}
