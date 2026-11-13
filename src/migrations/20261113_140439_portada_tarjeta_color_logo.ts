import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Color y logo PROPIOS de la tarjeta de «Maquinaria pesada nueva» en la portada (dirección,
 * 2026-11-13): la sección deja de usar los de las baldosas de repuestos. Se siembran los valores
 * del diseño del cliente (`portada-nueva-v2`, `MaquinariaNueva`) en las cinco marcas, por su
 * dirección web; una marca que no exista en la base no se toca. SQL explícito (CLAUDE.md §3.5).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_marcas_maquinaria_portada_logo_variante" AS ENUM('original', 'blanco');
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_color_panel" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_color_panel_fin" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "portada_logo_variante" "enum_marcas_maquinaria_portada_logo_variante" DEFAULT 'original';
  UPDATE "marcas_maquinaria" SET "portada_color_panel" = '#e8571a', "portada_color_panel_fin" = '#f58a3c', "portada_logo_variante" = 'blanco' WHERE "slug" = 'hitachi';
  UPDATE "marcas_maquinaria" SET "portada_color_panel" = '#f6ead4', "portada_color_panel_fin" = '#efd7a6', "portada_logo_variante" = 'original' WHERE "slug" = 'case-construction';
  UPDATE "marcas_maquinaria" SET "portada_color_panel" = '#c8141f', "portada_color_panel_fin" = '#e8323a', "portada_logo_variante" = 'blanco' WHERE "slug" = 'dynapac';
  UPDATE "marcas_maquinaria" SET "portada_color_panel" = '#ffffff', "portada_color_panel_fin" = '#e9e9eb', "portada_logo_variante" = 'original' WHERE "slug" = 'yanmar';
  UPDATE "marcas_maquinaria" SET "portada_color_panel" = '#ffffff', "portada_color_panel_fin" = '#e3ebf7', "portada_logo_variante" = 'original' WHERE "slug" = 'liugong';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_color_panel";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_color_panel_fin";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "portada_logo_variante";
  DROP TYPE "public"."enum_marcas_maquinaria_portada_logo_variante";`)
}
