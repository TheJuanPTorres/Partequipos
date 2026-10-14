import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_hero_diapositivas_posicion_maquina" AS ENUM('debajo', 'sobre');
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "titulo_arriba" varchar;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "titulo_abajo" varchar;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "posicion_maquina" "enum_paginas_hero_diapositivas_posicion_maquina" DEFAULT 'debajo';
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "texto_circular" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "titulo_arriba";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "titulo_abajo";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "posicion_maquina";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "texto_circular";
  DROP TYPE "public"."enum_paginas_hero_diapositivas_posicion_maquina";`)
}
