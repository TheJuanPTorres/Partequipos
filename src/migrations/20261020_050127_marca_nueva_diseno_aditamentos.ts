import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * «Diseño de la página» de las marcas de maquinaria nueva y los textos de la
 * plantilla de Andrés de la marca de aditamentos (2026-10-20). Esquema y un
 * dato acotado: SOLO la marca con dirección web «aditamentos» pasa a ese diseño;
 * las demás quedan en «plantilla1» por el DEFAULT. Los textos toman su DEFAULT
 * (los del export, sin la errata «Aditamientos»).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_marcas_maquinaria_diseno_pagina" AS ENUM('plantilla1', 'aditamentos');
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "diseno_pagina" "enum_marcas_maquinaria_diseno_pagina" DEFAULT 'plantilla1';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_antetitulo" varchar DEFAULT 'Partequipos';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_titulo" varchar DEFAULT 'Aditamentos para maquinaria pesada';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_franja1" varchar DEFAULT 'Maquinaria pesada';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_franja2" varchar DEFAULT 'Servicio técnico';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_franja3" varchar DEFAULT 'Repuestos de calidad';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_compromiso_titulo" varchar DEFAULT 'Nuestro compromiso es ofrecerle soluciones para cada una de sus necesidades y proyectos a nivel nacional.';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_compromiso_entradilla" varchar DEFAULT 'Somos especialistas en repuestos de maquinaria pesada.';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_compromiso_texto" varchar DEFAULT 'Trabajamos con una amplia variedad de marcas de maquinaria pesada y repuestos, incluyendo: Link Belt, Caterpillar, Hitachi, Hyundai, Doosan, Komatsu, Kobelco, Case, John Deere, New Holland, Volvo, Liugong, Sumitomo, Yanmar, Sany, Jcb y muchas más.';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "plantilla_aditamentos_compromiso_boton" varchar DEFAULT 'Solicita asesoría';`)
  await db.execute(sql`
  UPDATE "marcas_maquinaria" SET "diseno_pagina" = 'aditamentos' WHERE "slug" = 'aditamentos';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP COLUMN "diseno_pagina";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_antetitulo";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_titulo";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_franja1";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_franja2";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_franja3";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_compromiso_titulo";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_compromiso_entradilla";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_compromiso_texto";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "plantilla_aditamentos_compromiso_boton";
  DROP TYPE "public"."enum_marcas_maquinaria_diseno_pagina";`)
}
