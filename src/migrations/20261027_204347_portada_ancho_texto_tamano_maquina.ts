import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_seccion_usada_descripcion_ancho" AS ENUM('estrecho', 'medio', 'ancho', 'columna');
  CREATE TYPE "public"."enum_paginas_seccion_usada_marcas_texto_ancho" AS ENUM('estrecho', 'medio', 'ancho', 'columna');
  CREATE TYPE "public"."enum_paginas_seccion_repuestos_descripcion_ancho" AS ENUM('estrecho', 'medio', 'ancho', 'columna');
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_descripcion_ancho" "enum_paginas_seccion_usada_descripcion_ancho" DEFAULT 'columna';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_marcas_texto_ancho" "enum_paginas_seccion_usada_marcas_texto_ancho" DEFAULT 'estrecho';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_descripcion_ancho" "enum_paginas_seccion_repuestos_descripcion_ancho" DEFAULT 'ancho';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_tamano_maquina" numeric DEFAULT 78;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP COLUMN "seccion_usada_descripcion_ancho";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_marcas_texto_ancho";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_descripcion_ancho";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_tamano_maquina";
  DROP TYPE "public"."enum_paginas_seccion_usada_descripcion_ancho";
  DROP TYPE "public"."enum_paginas_seccion_usada_marcas_texto_ancho";
  DROP TYPE "public"."enum_paginas_seccion_repuestos_descripcion_ancho";`)
}
