/*
 * GLOBAL `pie` (docs/diseno/decisiones-home-ux9.md §13).
 *
 * DECISIÓN DE DATOS, no solo de esquema (CLAUDE.md §10.17): además de crear las
 * tablas, SIEMBRA el contenido que el pie tenía en el código (`PIE_INICIAL`).
 * Sin esto, el pie de TODAS las páginas quedaría vacío al desplegar, hasta que
 * alguien lo rellenara en el panel. No pisa nada: la tabla es nueva.
 *
 * LA SIEMBRA ES SQL, NO LA API LOCAL (corregido el 2026-09-28, CLAUDE.md
 * §10.33 p.13). La primera versión usaba `payload.updateGlobal` con
 * `PIE_INICIAL`, y la API local consulta con el esquema del código ACTUAL: en
 * cuanto el global ganó `imagen_decorativa_id` (migración siguiente), esta
 * migración dejó de aplicarse en cualquier base nueva (`column
 * pie.imagen_decorativa_id does not exist`). Una migración solo puede tocar
 * las tablas y columnas que existen en SU punto del historial: por eso los
 * valores van escritos aquí y no importados del código, que seguirá cambiando.
 * Son los de `PIE_INICIAL` en `ad37601`, con los mismos ids que producción.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pie_columnas_enlaces_tipo" AS ENUM('pagina', 'telefono');
  CREATE TABLE "pie_columnas_enlaces" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"tipo" "enum_pie_columnas_enlaces_tipo" DEFAULT 'pagina' NOT NULL,
  	"destino" varchar
  );
  
  CREATE TABLE "pie_columnas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL
  );
  
  CREATE TABLE "pie" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lema" varchar NOT NULL,
  	"texto_boton" varchar NOT NULL,
  	"empresa_titulo" varchar,
  	"empresa_texto" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pie_columnas_enlaces" ADD CONSTRAINT "pie_columnas_enlaces_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pie_columnas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pie_columnas" ADD CONSTRAINT "pie_columnas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pie"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pie_columnas_enlaces_order_idx" ON "pie_columnas_enlaces" USING btree ("_order");
  CREATE INDEX "pie_columnas_enlaces_parent_id_idx" ON "pie_columnas_enlaces" USING btree ("_parent_id");
  CREATE INDEX "pie_columnas_order_idx" ON "pie_columnas" USING btree ("_order");
  CREATE INDEX "pie_columnas_parent_id_idx" ON "pie_columnas" USING btree ("_parent_id");`)

  await db.execute(sql`
  INSERT INTO "pie" ("id", "lema", "texto_boton", "empresa_titulo", "empresa_texto", "updated_at", "created_at")
  VALUES (
    1,
    'Ofrecemos Soluciones para tus Proyectos',
    'WhatsApp',
    'Somos una empresa que brinda soluciones integrales',
    'Ayudamos a sectores de la construcción, infraestructura, agroindustria y agregados; especializándonos en la venta de maquinaria pesada, repuestos, servicio técnico y lubricantes',
    now(),
    now()
  );
  SELECT setval(pg_get_serial_sequence('"pie"', 'id'), 1);

  INSERT INTO "pie_columnas" ("_order", "_parent_id", "id", "titulo") VALUES
    (1, 1, '6ab57ed8a5ec44005ea52b64', 'Maquinaria pesada'),
    (2, 1, '6ab57ed8a5ec44005ea52b67', 'Navegación'),
    (3, 1, '6ab57ed8a5ec44005ea52b6a', 'Contacto');

  INSERT INTO "pie_columnas_enlaces" ("_order", "_parent_id", "id", "etiqueta", "tipo", "destino") VALUES
    (1, '6ab57ed8a5ec44005ea52b64', '6ab57ed8a5ec44005ea52b60', 'Nueva', 'pagina', '/maquinaria-pesada/maquinaria-pesada-nueva/'),
    (2, '6ab57ed8a5ec44005ea52b64', '6ab57ed8a5ec44005ea52b61', 'Usada', 'pagina', '/maquinaria-pesada/maquinaria-pesada-usada/'),
    (3, '6ab57ed8a5ec44005ea52b64', '6ab57ed8a5ec44005ea52b62', 'Repuestos', 'pagina', '/repuestos-maquinaria-pesada-colombia/'),
    (4, '6ab57ed8a5ec44005ea52b64', '6ab57ed8a5ec44005ea52b63', 'Servicio técnico', 'pagina', '/servicio-tecnico/'),
    (1, '6ab57ed8a5ec44005ea52b67', '6ab57ed8a5ec44005ea52b65', 'Inicio', 'pagina', '/'),
    (2, '6ab57ed8a5ec44005ea52b67', '6ab57ed8a5ec44005ea52b66', 'Nosotros', 'pagina', '/nosotros/'),
    (1, '6ab57ed8a5ec44005ea52b6a', '6ab57ed8a5ec44005ea52b68', 'Call center', 'telefono', NULL),
    (2, '6ab57ed8a5ec44005ea52b6a', '6ab57ed8a5ec44005ea52b69', 'Solicita una cotización', 'pagina', '/contactanos/');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pie_columnas_enlaces" CASCADE;
  DROP TABLE "pie_columnas" CASCADE;
  DROP TABLE "pie" CASCADE;
  DROP TYPE "public"."enum_pie_columnas_enlaces_tipo";`)
}
