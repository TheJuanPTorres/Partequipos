import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Interruptor «Página de una categoría o marca sin unidades» del global
 * `paginas-indice`, grupo «Maquinaria pesada usada» (dirección, 2026-10-19: en
 * el sitio publicado solo plantillas de Andrés). Solo esquema; la fila
 * existente queda en 'provisional' por el DEFAULT.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_indice_usada_estado_vacio" AS ENUM('provisional', 'propio');
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_estado_vacio" "enum_paginas_indice_usada_estado_vacio" DEFAULT 'provisional' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP COLUMN "usada_estado_vacio";
  DROP TYPE "public"."enum_paginas_indice_usada_estado_vacio";`)
}
