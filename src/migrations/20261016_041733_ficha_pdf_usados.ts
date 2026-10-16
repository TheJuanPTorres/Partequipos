import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ALTER COLUMN "seccion_usada_ver_producto_texto" SET DEFAULT 'Ver más';
  ALTER TABLE "paginas" ALTER COLUMN "seccion_usada_boton_texto" SET DEFAULT 'Ver todo';
  ALTER TABLE "equipos_usados" ADD COLUMN "ficha_tecnica_pdf_id" integer;
  ALTER TABLE "equipos_usados" ADD CONSTRAINT "equipos_usados_ficha_tecnica_pdf_id_documentos_id_fk" FOREIGN KEY ("ficha_tecnica_pdf_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "equipos_usados_ficha_tecnica_pdf_idx" ON "equipos_usados" USING btree ("ficha_tecnica_pdf_id");`)
  // Home V2: «Ver más» y «Ver todo». Solo si el texto es EXACTAMENTE el de ux-9:
  // lo que un editor haya escrito no se toca.
  await db.execute(sql`
   UPDATE "paginas" SET "seccion_usada_ver_producto_texto" = 'Ver más' WHERE "seccion_usada_ver_producto_texto" = 'Ver producto';
  UPDATE "paginas" SET "seccion_usada_boton_texto" = 'Ver todo' WHERE "seccion_usada_boton_texto" = 'Ver todas las excavadoras';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "paginas" SET "seccion_usada_ver_producto_texto" = 'Ver producto' WHERE "seccion_usada_ver_producto_texto" = 'Ver más';
  UPDATE "paginas" SET "seccion_usada_boton_texto" = 'Ver todas las excavadoras' WHERE "seccion_usada_boton_texto" = 'Ver todo';`)
  await db.execute(sql`
   ALTER TABLE "equipos_usados" DROP CONSTRAINT "equipos_usados_ficha_tecnica_pdf_id_documentos_id_fk";
  
  DROP INDEX "equipos_usados_ficha_tecnica_pdf_idx";
  ALTER TABLE "paginas" ALTER COLUMN "seccion_usada_ver_producto_texto" SET DEFAULT 'Ver producto';
  ALTER TABLE "paginas" ALTER COLUMN "seccion_usada_boton_texto" SET DEFAULT 'Ver todas las excavadoras';
  ALTER TABLE "equipos_usados" DROP COLUMN "ficha_tecnica_pdf_id";`)
}
