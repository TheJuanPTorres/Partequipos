import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_equipos_usados_pestana_portada" AS ENUM('categoria', 'aditamentos');
  CREATE TABLE "cabecera_enlaces" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"enlace" varchar NOT NULL
  );
  
  CREATE TABLE "cabecera" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"boton_texto" varchar DEFAULT 'Contáctanos',
  	"boton_enlace" varchar DEFAULT '/contactanos/',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pie_legales" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"enlace" varchar NOT NULL
  );
  
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "orden_portada" numeric;
  ALTER TABLE "equipos_usados" ADD COLUMN "pestana_portada" "enum_equipos_usados_pestana_portada" DEFAULT 'categoria';
  ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_antetitulo" varchar DEFAULT 'Venta de maquinaria';
  ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_titulo" varchar DEFAULT 'Maquinaria pesada nueva';
  ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_boton_texto" varchar DEFAULT 'Ver todo';
  ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_boton_enlace" varchar DEFAULT '/maquinaria-pesada/maquinaria-pesada-nueva/marcas/';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_antetitulo" varchar DEFAULT 'Venta de maquinaria';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_titulo" varchar DEFAULT 'Maquinaria pesada usada';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_pestana_excavadoras" varchar DEFAULT 'Excavadoras';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_pestana_otros" varchar DEFAULT 'Otros';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_pestana_aditamentos" varchar DEFAULT 'Aditamentos';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_ver_producto_texto" varchar DEFAULT 'Ver producto';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_marcas_titulo" varchar DEFAULT 'Marcas que Respaldan Nuestro Trabajo';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_marcas_texto" varchar DEFAULT 'Trabajamos con fabricantes líderes a nivel internacional para ofrecerle calidad, rendimiento y respaldo';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_boton_texto" varchar DEFAULT 'Ver todas las excavadoras';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_antetitulo" varchar DEFAULT 'Venta de repuestos';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_titulo" varchar DEFAULT 'Encuentra Maquinaria y Repuestos Rápido y Fácil';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_ver_mas_texto" varchar DEFAULT 'Ver más';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_boton_texto" varchar DEFAULT 'Ver todos los repuestos';
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_boton_enlace" varchar DEFAULT '/repuestos-maquinaria-pesada-colombia/';
  ALTER TABLE "paginas" ADD COLUMN "seccion_compania_titulo" varchar DEFAULT 'Nuestra Compañía';
  ALTER TABLE "paginas" ADD COLUMN "seccion_compania_texto" varchar DEFAULT 'En Partequipos somos expertos en repuestos y maquinaria pesada, con asesores en todo el país que marcan la diferencia en Colombia';
  ALTER TABLE "paginas" ADD COLUMN "seccion_compania_marquesina" varchar DEFAULT 'MAQUINARIA PESADA EN COLOMBIA';
  ALTER TABLE "paginas" ADD COLUMN "seccion_compania_marquesina_enlace" varchar DEFAULT '/nosotros/';
  ALTER TABLE "paginas" ADD COLUMN "seccion_catalogo_titulo" varchar DEFAULT 'Encuentra la maquinaria que tu operación necesita';
  ALTER TABLE "paginas" ADD COLUMN "seccion_catalogo_catalogo_texto" varchar DEFAULT 'Catálogo';
  ALTER TABLE "paginas" ADD COLUMN "seccion_catalogo_catalogo_enlace" varchar DEFAULT '/maquinaria-pesada/';
  ALTER TABLE "paginas" ADD COLUMN "seccion_catalogo_whatsapp_texto" varchar DEFAULT 'WhatsApp';
  ALTER TABLE "paginas" ADD COLUMN "seccion_sedes_titulo" varchar DEFAULT 'Nuestras sedes';
  ALTER TABLE "paginas" ADD COLUMN "seccion_testimonios_titulo" varchar DEFAULT 'La confianza de nuestros clientes habla por nosotros';
  ALTER TABLE "paginas" ADD COLUMN "seccion_testimonios_ver_video_texto" varchar DEFAULT 'Ver Video';
  ALTER TABLE "paginas" ADD COLUMN "seccion_faq_titulo" varchar DEFAULT 'Preguntas frecuentes';
  ALTER TABLE "paginas" ADD COLUMN "seccion_faq_intro" varchar DEFAULT 'Resuelve tus dudas sobre nuestros equipos, repuestos y servicios. En Partequipos estamos para ayudarte a encontrar las mejores soluciones para mantener tu maquinaria trabajando.';
  ALTER TABLE "paginas" ADD COLUMN "seccion_faq_boton_texto" varchar DEFAULT 'Solicita asesoría';
  ALTER TABLE "paginas" ADD COLUMN "seccion_faq_boton_enlace" varchar DEFAULT '/contactanos/';
  ALTER TABLE "cabecera_enlaces" ADD CONSTRAINT "cabecera_enlaces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cabecera"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pie_legales" ADD CONSTRAINT "pie_legales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pie"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "cabecera_enlaces_order_idx" ON "cabecera_enlaces" USING btree ("_order");
  CREATE INDEX "cabecera_enlaces_parent_id_idx" ON "cabecera_enlaces" USING btree ("_parent_id");
  CREATE INDEX "pie_legales_order_idx" ON "pie_legales" USING btree ("_order");
  CREATE INDEX "pie_legales_parent_id_idx" ON "pie_legales" USING btree ("_parent_id");`)

  /*
   * SIEMBRA (CLAUDE.md §3.5: SQL explícito, nunca la API local).
   * - Los textos de las secciones de la portada ya quedan puestos por el
   *   DEFAULT de cada columna (Postgres rellena las filas existentes).
   * - La cabecera: los cuatro enlaces y el botón de ux-9 (export 2162), los que
   *   antes estaban en `src/lib/navegacion.ts`.
   * - Los enlaces legales del pie, también antes en `navegacion.ts`, con
   *   tratamiento de datos el primero. El pie es la fila que sembró
   *   `20260924_194316_pie_global`.
   * - La posición en la portada de las tres marcas de la sección 2 de ux-9
   *   (Hitachi, CASE y Yanmar), si existen.
   */
  await db.execute(sql`
  INSERT INTO "cabecera" ("id", "boton_texto", "boton_enlace", "updated_at", "created_at")
  VALUES (1, 'Contáctanos', '/contactanos/', now(), now());

  INSERT INTO "cabecera_enlaces" ("_order", "_parent_id", "id", "etiqueta", "enlace") VALUES
    (1, 1, '6ad1a0c1a5ec44005ea5c001', 'Maquinaria Pesada', '/maquinaria-pesada/'),
    (2, 1, '6ad1a0c1a5ec44005ea5c002', 'Repuestos', '/repuestos-maquinaria-pesada-colombia/'),
    (3, 1, '6ad1a0c1a5ec44005ea5c003', 'Lubricantes', '/lubricantes/lubricantes-eni/'),
    (4, 1, '6ad1a0c1a5ec44005ea5c004', 'Servicio Técnico', '/servicio-tecnico/');

  SELECT setval(pg_get_serial_sequence('"cabecera"', 'id'), 1);

  INSERT INTO "pie_legales" ("_order", "_parent_id", "id", "etiqueta", "enlace")
  SELECT v.o, p.id, v.i, v.e, v.u
  FROM (SELECT id FROM "pie" ORDER BY id LIMIT 1) p,
  (VALUES
    (1, '6ad1a0c1a5ec44005ea5c011', 'Tratamiento de datos', '/tratamiento-de-datos/'),
    (2, '6ad1a0c1a5ec44005ea5c012', 'Política de garantías', '/politica-de-garantia-de-repuestos/'),
    (3, '6ad1a0c1a5ec44005ea5c013', 'Código de ética', '/codigo-de-etica-partequipos/'),
    (4, '6ad1a0c1a5ec44005ea5c014', 'Términos campaña bonos', '/terminos-y-condiciones-campana-bonos-de-recompra/')
  ) AS v(o, i, e, u);

  UPDATE "marcas_maquinaria" SET "orden_portada" = 1 WHERE "slug" = 'hitachi';
  UPDATE "marcas_maquinaria" SET "orden_portada" = 2 WHERE "slug" = 'case-construction';
  UPDATE "marcas_maquinaria" SET "orden_portada" = 3 WHERE "slug" = 'yanmar';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "cabecera_enlaces" CASCADE;
  DROP TABLE "cabecera" CASCADE;
  DROP TABLE "pie_legales" CASCADE;
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "orden_portada";
  ALTER TABLE "equipos_usados" DROP COLUMN "pestana_portada";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_antetitulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_boton_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_boton_enlace";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_antetitulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_pestana_excavadoras";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_pestana_otros";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_pestana_aditamentos";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_ver_producto_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_marcas_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_marcas_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_boton_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_antetitulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_ver_mas_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_boton_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_boton_enlace";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_marquesina";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_marquesina_enlace";
  ALTER TABLE "paginas" DROP COLUMN "seccion_catalogo_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_catalogo_catalogo_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_catalogo_catalogo_enlace";
  ALTER TABLE "paginas" DROP COLUMN "seccion_catalogo_whatsapp_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_sedes_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_testimonios_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_testimonios_ver_video_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_faq_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_faq_intro";
  ALTER TABLE "paginas" DROP COLUMN "seccion_faq_boton_texto";
  ALTER TABLE "paginas" DROP COLUMN "seccion_faq_boton_enlace";
  DROP TYPE "public"."enum_equipos_usados_pestana_portada";`)
}
