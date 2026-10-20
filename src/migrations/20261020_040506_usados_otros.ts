import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Usados como en WordPress (cliente, 2026-10-19): Excavadoras, Aditamentos y
 * «Otros» en el primer nivel. Casilla «Agrupar en «Otros»» y «Orden en el
 * primer nivel» en las categorías de usada, y los textos de la página «Otros»
 * en el global `paginas_indice`.
 *
 * Siembra con SQL explícito (CLAUDE.md §3.5): todas las categorías quedan en
 * «Otros» por el DEFAULT, salvo Excavadoras (1) y Aditamentos (2), que salen
 * en el primer nivel. Si una base no tiene alguna de las dos, el UPDATE no
 * toca nada.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_usada" ADD COLUMN "en_otros" boolean DEFAULT true;
  ALTER TABLE "categorias_usada" ADD COLUMN "orden" numeric;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_otros_antetitulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_otros_titulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_otros_texto" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_otros_fondo_id" integer;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_otros_imagen_tarjeta_id" integer;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_usada_otros_fondo_id_media_id_fk" FOREIGN KEY ("usada_otros_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_usada_otros_imagen_tarjeta_id_media_id_fk" FOREIGN KEY ("usada_otros_imagen_tarjeta_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_indice_usada_otros_usada_otros_fondo_idx" ON "paginas_indice" USING btree ("usada_otros_fondo_id");
  CREATE INDEX "paginas_indice_usada_otros_usada_otros_imagen_tarjeta_idx" ON "paginas_indice" USING btree ("usada_otros_imagen_tarjeta_id");`)
  await db.execute(sql`
   UPDATE "categorias_usada" SET "en_otros" = false, "orden" = 1 WHERE "slug" = 'excavadoras';
  UPDATE "categorias_usada" SET "en_otros" = false, "orden" = 2 WHERE "slug" = 'aditamentos';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_usada_otros_fondo_id_media_id_fk";
  
  ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_usada_otros_imagen_tarjeta_id_media_id_fk";
  
  DROP INDEX "paginas_indice_usada_otros_usada_otros_fondo_idx";
  DROP INDEX "paginas_indice_usada_otros_usada_otros_imagen_tarjeta_idx";
  ALTER TABLE "categorias_usada" DROP COLUMN "en_otros";
  ALTER TABLE "categorias_usada" DROP COLUMN "orden";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_otros_antetitulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_otros_titulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_otros_texto";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_otros_fondo_id";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_otros_imagen_tarjeta_id";`)
}
