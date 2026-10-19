import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * «¿Por qué elegirnos?» del global `repuestos-marca` (plantilla de Andrés, 2026-10-19): columnas y tabla
 * de los puntos, y los textos de la plantilla sembrados con SQL explícito (CLAUDE.md §3.5).
 * La foto la elige el editor en el panel; sin ella, un fondo oscuro.
 *
 * IDEMPOTENTE a propósito: el preview ya aplicó una primera versión (20261019_142849, retirada al
 * renombrarla tras fusionar `main`), así que cada sentencia tolera que el objeto ya exista y la siembra
 * no pisa textos ya puestos.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "repuestos_marca_por_que_puntos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"texto" varchar NOT NULL
  );
  
  ALTER TABLE "repuestos_marca" ADD COLUMN IF NOT EXISTS "por_que_titulo" varchar;
  ALTER TABLE "repuestos_marca" ADD COLUMN IF NOT EXISTS "por_que_imagen_id" integer;
  ALTER TABLE "repuestos_marca" ADD COLUMN IF NOT EXISTS "por_que_cierre" varchar;
  ALTER TABLE "repuestos_marca" ADD COLUMN IF NOT EXISTS "por_que_boton" varchar;
  ALTER TABLE "repuestos_marca_por_que_puntos" DROP CONSTRAINT IF EXISTS "repuestos_marca_por_que_puntos_parent_id_fk";
  ALTER TABLE "repuestos_marca_por_que_puntos" ADD CONSTRAINT "repuestos_marca_por_que_puntos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."repuestos_marca"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "repuestos_marca_por_que_puntos_order_idx" ON "repuestos_marca_por_que_puntos" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "repuestos_marca_por_que_puntos_parent_id_idx" ON "repuestos_marca_por_que_puntos" USING btree ("_parent_id");
  ALTER TABLE "repuestos_marca" DROP CONSTRAINT IF EXISTS "repuestos_marca_por_que_imagen_id_media_id_fk";
  ALTER TABLE "repuestos_marca" ADD CONSTRAINT "repuestos_marca_por_que_imagen_id_media_id_fk" FOREIGN KEY ("por_que_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "repuestos_marca_por_que_imagen_idx" ON "repuestos_marca" USING btree ("por_que_imagen_id");`)

  await db.execute(sql`
   UPDATE "repuestos_marca" SET
    "por_que_titulo" = '¿Por qué elegirnos?',
    "por_que_cierre" = 'Confíe en Partequipos para encontrar los repuestos que su maquinaria pesada {marca} merece.',
    "por_que_boton" = 'Solicita asesoría'
   WHERE "por_que_titulo" IS NULL;
  INSERT INTO "repuestos_marca_por_que_puntos" ("_order", "_parent_id", "id", "titulo", "texto")
   SELECT v.o, r."id", v.i, v.t, v.x FROM "repuestos_marca" r, (VALUES
    (1, 'por-que-calidad', 'Calidad Certificada', 'Todos nuestros productos cumplen con los estándares de calidad más altos.'),
    (2, 'por-que-entrega', 'Entrega Rápida', 'Enviamos a todo Colombia de manera rápida y segura.'),
    (3, 'por-que-asesoria', 'Asesoramiento Técnico', 'Nuestro equipo de expertos está listo para brindar asesoramiento técnico personalizado.')
   ) AS v(o, i, t, x)
   WHERE NOT EXISTS (SELECT 1 FROM "repuestos_marca_por_que_puntos" p WHERE p."_parent_id" = r."id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "repuestos_marca_por_que_puntos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "repuestos_marca_por_que_puntos" CASCADE;
  ALTER TABLE "repuestos_marca" DROP CONSTRAINT "repuestos_marca_por_que_imagen_id_media_id_fk";
  
  DROP INDEX "repuestos_marca_por_que_imagen_idx";
  ALTER TABLE "repuestos_marca" DROP COLUMN "por_que_titulo";
  ALTER TABLE "repuestos_marca" DROP COLUMN "por_que_imagen_id";
  ALTER TABLE "repuestos_marca" DROP COLUMN "por_que_cierre";
  ALTER TABLE "repuestos_marca" DROP COLUMN "por_que_boton";`)
}
