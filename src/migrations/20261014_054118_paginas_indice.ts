import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_indice_repuestos_tarjetas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"enlace" varchar NOT NULL,
  	"imagen_id" integer
  );
  
  CREATE TABLE "paginas_indice_maquinaria_tarjetas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"enlace" varchar NOT NULL,
  	"imagen_id" integer
  );
  
  CREATE TABLE "paginas_indice" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"repuestos_antetitulo" varchar,
  	"repuestos_titulo" varchar,
  	"repuestos_texto" varchar,
  	"repuestos_fondo_id" integer,
  	"maquinaria_antetitulo" varchar,
  	"maquinaria_titulo" varchar,
  	"maquinaria_texto" varchar,
  	"maquinaria_fondo_id" integer,
  	"contacto_antetitulo" varchar,
  	"contacto_titulo" varchar,
  	"contacto_titulo_canales" varchar,
  	"contacto_etiqueta_telefono" varchar,
  	"contacto_etiqueta_correo" varchar,
  	"contacto_etiqueta_direccion" varchar,
  	"contacto_titulo_horario" varchar,
  	"contacto_foto_id" integer,
  	"contacto_imagen_decorativa_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "paginas_indice_repuestos_tarjetas" ADD CONSTRAINT "paginas_indice_repuestos_tarjetas_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice_repuestos_tarjetas" ADD CONSTRAINT "paginas_indice_repuestos_tarjetas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_indice"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_indice_maquinaria_tarjetas" ADD CONSTRAINT "paginas_indice_maquinaria_tarjetas_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice_maquinaria_tarjetas" ADD CONSTRAINT "paginas_indice_maquinaria_tarjetas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_indice"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_repuestos_fondo_id_media_id_fk" FOREIGN KEY ("repuestos_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_maquinaria_fondo_id_media_id_fk" FOREIGN KEY ("maquinaria_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_contacto_foto_id_media_id_fk" FOREIGN KEY ("contacto_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_contacto_imagen_decorativa_id_media_id_fk" FOREIGN KEY ("contacto_imagen_decorativa_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_indice_repuestos_tarjetas_order_idx" ON "paginas_indice_repuestos_tarjetas" USING btree ("_order");
  CREATE INDEX "paginas_indice_repuestos_tarjetas_parent_id_idx" ON "paginas_indice_repuestos_tarjetas" USING btree ("_parent_id");
  CREATE INDEX "paginas_indice_repuestos_tarjetas_imagen_idx" ON "paginas_indice_repuestos_tarjetas" USING btree ("imagen_id");
  CREATE INDEX "paginas_indice_maquinaria_tarjetas_order_idx" ON "paginas_indice_maquinaria_tarjetas" USING btree ("_order");
  CREATE INDEX "paginas_indice_maquinaria_tarjetas_parent_id_idx" ON "paginas_indice_maquinaria_tarjetas" USING btree ("_parent_id");
  CREATE INDEX "paginas_indice_maquinaria_tarjetas_imagen_idx" ON "paginas_indice_maquinaria_tarjetas" USING btree ("imagen_id");
  CREATE INDEX "paginas_indice_repuestos_repuestos_fondo_idx" ON "paginas_indice" USING btree ("repuestos_fondo_id");
  CREATE INDEX "paginas_indice_maquinaria_maquinaria_fondo_idx" ON "paginas_indice" USING btree ("maquinaria_fondo_id");
  CREATE INDEX "paginas_indice_contacto_contacto_foto_idx" ON "paginas_indice" USING btree ("contacto_foto_id");
  CREATE INDEX "paginas_indice_contacto_contacto_imagen_decorativa_idx" ON "paginas_indice" USING btree ("contacto_imagen_decorativa_id");`)

  /*
   * SIEMBRA (CLAUDE.md §3.5: SQL explícito, nunca la API local). El global
   * `paginas-indice` es una fila única: los textos de las plantillas de Andrés
   * (la errata de «con nosotro» ya corregida) y las seis tarjetas de cada página
   * índice, con enlaces que ya existen. SIN imágenes: las de la web original las
   * sube un script al preview y el panel en producción. Idempotente.
   */
  await db.execute(sql`
  INSERT INTO "paginas_indice" (
    "id", "repuestos_antetitulo", "repuestos_titulo", "repuestos_texto",
    "maquinaria_antetitulo", "maquinaria_titulo",
    "contacto_antetitulo", "contacto_titulo", "contacto_titulo_canales",
    "contacto_etiqueta_telefono", "contacto_etiqueta_correo", "contacto_etiqueta_direccion",
    "contacto_titulo_horario", "updated_at", "created_at"
  )
  SELECT 1,
    'Somos tu socio confiable en maquinaria pesada y repuestos',
    'Repuestos para Maquinaria pesada',
    'Partequipos SAS se enorgullece de ser tu destino de confianza para maquinaria pesada, repuestos y servicios técnicos de calidad. Atendemos a una audiencia diversa de propietarios de maquinaria pesada en Colombia, especializándonos en los sectores de minería, construcción e infraestructura.',
    'Maquinaria nueva y usada',
    'Encuentra Maquinaria y Repuestos Rápido y Fácil',
    'Contacto Partequipos', 'Ponte en contacto con nosotros', 'Canales adicionales',
    'Llámanos', 'Email', 'Dirección',
    'Horario de atención', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM "paginas_indice" WHERE "id" = 1);

  SELECT setval(pg_get_serial_sequence('paginas_indice', 'id'), GREATEST((SELECT MAX("id") FROM "paginas_indice"), 1));

  INSERT INTO "paginas_indice_repuestos_tarjetas" ("_order", "_parent_id", "id", "titulo", "enlace")
  SELECT v."orden", 1, v."id", v."titulo", v."enlace"
  FROM (VALUES
    (1, '6ad1e7c0a5ec44005ea6a001', 'Repuestos por marca', '/repuestos-maquinaria-pesada-colombia/repuestos-maquinaria-pesada-marcas/'),
    (2, '6ad1e7c0a5ec44005ea6a002', 'Categorías técnicas', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/'),
    (3, '6ad1e7c0a5ec44005ea6a003', 'Tren de rodaje', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/tren-de-rodaje-para-maquinaria-pesada/'),
    (4, '6ad1e7c0a5ec44005ea6a004', 'Filtración', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/filtracion-para-maquinaria-pesada/'),
    (5, '6ad1e7c0a5ec44005ea6a005', 'Herramienta de corte (GETS)', '/repuestos-maquinaria-pesada-colombia/categoria-repuestos-para-maquinaria-pesada/herramienta-de-corte-gets-para-maquinaria-pesada/'),
    (6, '6ad1e7c0a5ec44005ea6a006', 'Lubricantes', '/lubricantes/lubricantes-eni/')
  ) AS v("orden", "id", "titulo", "enlace")
  WHERE EXISTS (SELECT 1 FROM "paginas_indice" WHERE "id" = 1)
    AND NOT EXISTS (SELECT 1 FROM "paginas_indice_repuestos_tarjetas" WHERE "_parent_id" = 1);

  INSERT INTO "paginas_indice_maquinaria_tarjetas" ("_order", "_parent_id", "id", "titulo", "enlace")
  SELECT v."orden", 1, v."id", v."titulo", v."enlace"
  FROM (VALUES
    (1, '6ad1e7c0a5ec44005ea6b001', 'Maquinaria pesada nueva', '/maquinaria-pesada/maquinaria-pesada-nueva/'),
    (2, '6ad1e7c0a5ec44005ea6b002', 'Maquinaria pesada usada', '/maquinaria-pesada/maquinaria-pesada-usada/'),
    (3, '6ad1e7c0a5ec44005ea6b003', 'Aditamentos', '/maquinaria-pesada/maquinaria-pesada-nueva/marcas/aditamentos/'),
    (4, '6ad1e7c0a5ec44005ea6b004', 'Repuestos', '/repuestos-maquinaria-pesada-colombia/'),
    (5, '6ad1e7c0a5ec44005ea6b005', 'Lubricantes', '/lubricantes/lubricantes-eni/'),
    (6, '6ad1e7c0a5ec44005ea6b006', 'Servicio técnico', '/servicio-tecnico/')
  ) AS v("orden", "id", "titulo", "enlace")
  WHERE EXISTS (SELECT 1 FROM "paginas_indice" WHERE "id" = 1)
    AND NOT EXISTS (SELECT 1 FROM "paginas_indice_maquinaria_tarjetas" WHERE "_parent_id" = 1);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "paginas_indice_repuestos_tarjetas" CASCADE;
  DROP TABLE "paginas_indice_maquinaria_tarjetas" CASCADE;
  DROP TABLE "paginas_indice" CASCADE;`)
}
