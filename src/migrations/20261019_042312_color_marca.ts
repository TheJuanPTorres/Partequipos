import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * «Color de la marca» en las marcas de repuestos y en las de maquinaria nueva
 * (2026-10-18, cliente): la franja de color de sus páginas deja de ser siempre el
 * amarillo de Caterpillar. Columna opcional y, con SQL explícito (CLAUDE.md §3.5),
 * el color de cada marca que ya existe. Fuentes y grado de certeza de cada valor en
 * `docs/colores-de-marca.md`; el cliente los cambia desde el panel.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas" ADD COLUMN "color_marca" varchar;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "color_marca" varchar;
  UPDATE "marcas" SET "color_marca" = v.c FROM (VALUES
    ('repuestos-para-maquinaria-pesada-caterpillar', '#ffcd00'),
    ('repuestos-para-maquinaria-pesada-case-construction', '#f2a900'),
    ('repuestos-para-maquinaria-pesada-hitachi', '#fc661c'),
    ('repuestos-para-maquinaria-pesada-komatsu', '#283d99'),
    ('repuestos-para-maquinaria-pesada-hyundai', '#154fa3'),
    ('repuestos-para-maquinaria-pesada-liugong', '#0c4da2'),
    ('repuestos-para-maquinaria-pesada-doosan', '#062f86'),
    ('repuestos-para-maquinaria-pesada-link-belt', '#ce1922'),
    ('repuestos-para-maquinaria-pesada-kobelco', '#0b4ea2'),
    ('repuestos-para-maquinaria-pesada-bobcat', '#e31837'),
    ('repuestos-para-maquinaria-pesada-yanmar', '#ed1c24'),
    ('repuestos-para-maquinaria-pesada-volvo', '#003057')
  ) AS v(s, c) WHERE "marcas"."slug" = v.s;
  UPDATE "marcas_maquinaria" SET "color_marca" = v.c FROM (VALUES
    ('hitachi', '#fc661c'),
    ('case-construction', '#f2a900'),
    ('dynapac', '#bf2e1a'),
    ('yanmar', '#ed1c24'),
    ('ammann', '#e30613')
  ) AS v(s, c) WHERE "marcas_maquinaria"."slug" = v.s;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas" DROP COLUMN IF EXISTS "color_marca";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN IF EXISTS "color_marca";`)
}
