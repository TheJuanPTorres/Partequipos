import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "modelos_repuesto_piezas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL
  );
  
  CREATE TABLE "tipos_equipo_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categorias_tecnicas_id" integer
  );
  
  ALTER TABLE "solicitudes" ADD COLUMN "ciudad" varchar;
  ALTER TABLE "modelos_repuesto" ADD COLUMN "antetitulo" varchar;
  ALTER TABLE "modelos_repuesto" ADD COLUMN "titulo_pagina" varchar;
  ALTER TABLE "modelos_repuesto" ADD COLUMN "titulo_disponibles" varchar;
  ALTER TABLE "modelos_repuesto" ADD COLUMN "mostrar_piezas" boolean DEFAULT false;
  ALTER TABLE "repuestos_marca" ADD COLUMN "modelo_ayuda_titulo" varchar;
  ALTER TABLE "repuestos_marca" ADD COLUMN "modelo_ayuda_texto" varchar;
  ALTER TABLE "repuestos_marca" ADD COLUMN "modelo_ayuda_boton" varchar;
  ALTER TABLE "repuestos_marca" ADD COLUMN "modelo_ayuda_foto_id" integer;
  ALTER TABLE "repuestos_marca" ADD COLUMN "modelo_contacto_titulo" varchar;
  ALTER TABLE "modelos_repuesto_piezas" ADD CONSTRAINT "modelos_repuesto_piezas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."modelos_repuesto"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tipos_equipo_rels" ADD CONSTRAINT "tipos_equipo_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tipos_equipo"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tipos_equipo_rels" ADD CONSTRAINT "tipos_equipo_rels_categorias_tecnicas_fk" FOREIGN KEY ("categorias_tecnicas_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "modelos_repuesto_piezas_order_idx" ON "modelos_repuesto_piezas" USING btree ("_order");
  CREATE INDEX "modelos_repuesto_piezas_parent_id_idx" ON "modelos_repuesto_piezas" USING btree ("_parent_id");
  CREATE INDEX "tipos_equipo_rels_order_idx" ON "tipos_equipo_rels" USING btree ("order");
  CREATE INDEX "tipos_equipo_rels_parent_idx" ON "tipos_equipo_rels" USING btree ("parent_id");
  CREATE INDEX "tipos_equipo_rels_path_idx" ON "tipos_equipo_rels" USING btree ("path");
  CREATE INDEX "tipos_equipo_rels_categorias_tecnicas_id_idx" ON "tipos_equipo_rels" USING btree ("categorias_tecnicas_id");
  ALTER TABLE "repuestos_marca" ADD CONSTRAINT "repuestos_marca_modelo_ayuda_foto_id_media_id_fk" FOREIGN KEY ("modelo_ayuda_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "repuestos_marca_modelo_ayuda_foto_idx" ON "repuestos_marca" USING btree ("modelo_ayuda_foto_id");`)

  /*
   * Siembra de los textos de WordPress de la página de modelo (tal cual, decisión
   * del cliente), con SQL explícito (CLAUDE.md §3.5): la tarjeta «ESTAMOS AQUÍ
   * PARA AYUDARLO · Escríbenos · Whatsapp» y el título del formulario. Solo si
   * están vacíos (columnas recién creadas: siempre, salvo que se repita a mano).
   * La foto la elige el importador o el panel.
   */
  await db.execute(sql`
   UPDATE "repuestos_marca" SET
     "modelo_ayuda_titulo" = COALESCE(NULLIF("modelo_ayuda_titulo", ''), 'ESTAMOS AQUÍ PARA AYUDARLO'),
     "modelo_ayuda_texto" = COALESCE(NULLIF("modelo_ayuda_texto", ''), 'Escríbenos'),
     "modelo_ayuda_boton" = COALESCE(NULLIF("modelo_ayuda_boton", ''), 'Whatsapp'),
     "modelo_contacto_titulo" = COALESCE(NULLIF("modelo_contacto_titulo", ''), 'Si deseas más info, contáctanos');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto_piezas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tipos_equipo_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "modelos_repuesto_piezas" CASCADE;
  DROP TABLE "tipos_equipo_rels" CASCADE;
  ALTER TABLE "repuestos_marca" DROP CONSTRAINT "repuestos_marca_modelo_ayuda_foto_id_media_id_fk";
  
  DROP INDEX "repuestos_marca_modelo_ayuda_foto_idx";
  ALTER TABLE "solicitudes" DROP COLUMN "ciudad";
  ALTER TABLE "modelos_repuesto" DROP COLUMN "antetitulo";
  ALTER TABLE "modelos_repuesto" DROP COLUMN "titulo_pagina";
  ALTER TABLE "modelos_repuesto" DROP COLUMN "titulo_disponibles";
  ALTER TABLE "modelos_repuesto" DROP COLUMN "mostrar_piezas";
  ALTER TABLE "repuestos_marca" DROP COLUMN "modelo_ayuda_titulo";
  ALTER TABLE "repuestos_marca" DROP COLUMN "modelo_ayuda_texto";
  ALTER TABLE "repuestos_marca" DROP COLUMN "modelo_ayuda_boton";
  ALTER TABLE "repuestos_marca" DROP COLUMN "modelo_ayuda_foto_id";
  ALTER TABLE "repuestos_marca" DROP COLUMN "modelo_contacto_titulo";`)
}
