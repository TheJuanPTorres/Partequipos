import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_seccion_usada_descripcion_alineacion" AS ENUM('left', 'center', 'right', 'justify');
  CREATE TYPE "public"."enum_paginas_seccion_usada_marcas_texto_alineacion" AS ENUM('left', 'center', 'right', 'justify');
  CREATE TYPE "public"."enum_paginas_seccion_repuestos_descripcion_alineacion" AS ENUM('left', 'center', 'right', 'justify');
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_descripcion_alineacion" "enum_paginas_seccion_usada_descripcion_alineacion" DEFAULT 'left';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_marcas_texto_alineacion" "enum_paginas_seccion_usada_marcas_texto_alineacion" DEFAULT 'left';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_descripcion_alineacion" "enum_paginas_seccion_repuestos_descripcion_alineacion" DEFAULT 'left';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP COLUMN "seccion_usada_descripcion_alineacion";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_marcas_texto_alineacion";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_descripcion_alineacion";
  DROP TYPE "public"."enum_paginas_seccion_usada_descripcion_alineacion";
  DROP TYPE "public"."enum_paginas_seccion_usada_marcas_texto_alineacion";
  DROP TYPE "public"."enum_paginas_seccion_repuestos_descripcion_alineacion";`)
}
