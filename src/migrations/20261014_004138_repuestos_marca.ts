import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_solicitudes_interes" AS ENUM('cotizar', 'muestras', 'asesoria', 'otro');
  CREATE TYPE "public"."enum_solicitudes_perfil" AS ENUM('empresa', 'comprador', 'emprendedor', 'proveedor', 'empleado', 'otro');
  ALTER TYPE "public"."enum_categorias_tecnicas_icono" ADD VALUE 'miscelaneos';
  ALTER TYPE "public"."enum_categorias_tecnicas_icono" ADD VALUE 'componentes';
  ALTER TYPE "public"."enum_categorias_tecnicas_icono" ADD VALUE 'diesel';
  CREATE TABLE "repuestos_marca" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo_hero" varchar,
  	"subtitulo_hero" varchar,
  	"titulo_categorias" varchar,
  	"titulo_tipos" varchar,
  	"ver_todo_texto" varchar,
  	"tarjeta_usadas_titulo" varchar,
  	"tarjeta_usadas_enlace" varchar,
  	"tarjeta_usadas_imagen_id" integer,
  	"tarjeta_aditamentos_titulo" varchar,
  	"tarjeta_aditamentos_enlace" varchar,
  	"tarjeta_aditamentos_imagen_id" integer,
  	"contacto_titulo" varchar,
  	"contacto_subtitulo" varchar,
  	"contacto_boton" varchar,
  	"testimonios_titulo" varchar,
  	"ver_video_texto" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "solicitudes" ADD COLUMN "interes" "enum_solicitudes_interes";
  ALTER TABLE "solicitudes" ADD COLUMN "perfil" "enum_solicitudes_perfil";
  ALTER TABLE "marcas" ADD COLUMN "fondo_hero_id" integer;
  ALTER TABLE "tipos_equipo" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "orden_marca" numeric;
  ALTER TABLE "repuestos_marca" ADD CONSTRAINT "repuestos_marca_tarjeta_usadas_imagen_id_media_id_fk" FOREIGN KEY ("tarjeta_usadas_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "repuestos_marca" ADD CONSTRAINT "repuestos_marca_tarjeta_aditamentos_imagen_id_media_id_fk" FOREIGN KEY ("tarjeta_aditamentos_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "repuestos_marca_tarjeta_usadas_tarjeta_usadas_imagen_idx" ON "repuestos_marca" USING btree ("tarjeta_usadas_imagen_id");
  CREATE INDEX "repuestos_marca_tarjeta_aditamentos_tarjeta_aditamentos__idx" ON "repuestos_marca" USING btree ("tarjeta_aditamentos_imagen_id");
  ALTER TABLE "marcas" ADD CONSTRAINT "marcas_fondo_hero_id_media_id_fk" FOREIGN KEY ("fondo_hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_equipo" ADD CONSTRAINT "tipos_equipo_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_fondo_hero_idx" ON "marcas" USING btree ("fondo_hero_id");
  CREATE INDEX "tipos_equipo_imagen_idx" ON "tipos_equipo" USING btree ("imagen_id");`)
  /*
   * SIEMBRA (CLAUDE.md §3.5: SQL explícito, nunca la API local). El global
   * `repuestos-marca` es una fila única: los textos de ux-9 y los enlaces de
   * las dos tarjetas del marketplace. Sin imágenes: las fotos de ux-9 tienen la
   * licencia pendiente (L3) y no van a la base de producción. Idempotente.
   */
  await db.execute(sql`
  INSERT INTO "repuestos_marca" (
    "id", "titulo_hero", "subtitulo_hero", "titulo_categorias", "titulo_tipos", "ver_todo_texto",
    "tarjeta_usadas_titulo", "tarjeta_usadas_enlace",
    "tarjeta_aditamentos_titulo", "tarjeta_aditamentos_enlace",
    "contacto_titulo", "contacto_subtitulo", "contacto_boton",
    "testimonios_titulo", "ver_video_texto", "updated_at", "created_at"
  )
  SELECT 1, 'Repuestos para maquinaria pesada', 'En Colombia',
    'Nuestras categorías de repuestos', 'Repuestos según tipo de máquina', 'Ver todo',
    'Maquinaria pesada usada', '/maquinaria-pesada/maquinaria-pesada-usada/',
    'Aditamentos', '/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/',
    'Contacto Partequipos', 'Si deseas más info, contáctanos', 'Enviar',
    'Testimonios reales', 'Ver Video', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM "repuestos_marca" WHERE "id" = 1);
  SELECT setval(pg_get_serial_sequence('repuestos_marca', 'id'), GREATEST((SELECT MAX("id") FROM "repuestos_marca"), 1));`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "repuestos_marca" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "repuestos_marca" CASCADE;
  ALTER TABLE "marcas" DROP CONSTRAINT "marcas_fondo_hero_id_media_id_fk";
  
  ALTER TABLE "tipos_equipo" DROP CONSTRAINT "tipos_equipo_imagen_id_media_id_fk";
  
  ALTER TABLE "categorias_tecnicas" ALTER COLUMN "icono" SET DATA TYPE text;
  DROP TYPE "public"."enum_categorias_tecnicas_icono";
  CREATE TYPE "public"."enum_categorias_tecnicas_icono" AS ENUM('corte', 'llanta', 'lubricante', 'filtro', 'motor', 'rodaje');
  ALTER TABLE "categorias_tecnicas" ALTER COLUMN "icono" SET DATA TYPE "public"."enum_categorias_tecnicas_icono" USING "icono"::"public"."enum_categorias_tecnicas_icono";
  DROP INDEX "marcas_fondo_hero_idx";
  DROP INDEX "tipos_equipo_imagen_idx";
  ALTER TABLE "solicitudes" DROP COLUMN "interes";
  ALTER TABLE "solicitudes" DROP COLUMN "perfil";
  ALTER TABLE "marcas" DROP COLUMN "fondo_hero_id";
  ALTER TABLE "tipos_equipo" DROP COLUMN "imagen_id";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "orden_marca";
  DROP TYPE "public"."enum_solicitudes_interes";
  DROP TYPE "public"."enum_solicitudes_perfil";`)
}
