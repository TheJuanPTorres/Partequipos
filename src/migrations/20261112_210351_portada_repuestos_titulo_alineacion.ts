import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_seccion_repuestos_titulo_alineacion" AS ENUM('left', 'center', 'justify');
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_titulo_alineacion" "enum_paginas_seccion_repuestos_titulo_alineacion" DEFAULT 'center';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_titulo_alineacion";
  DROP TYPE "public"."enum_paginas_seccion_repuestos_titulo_alineacion";`)
}
