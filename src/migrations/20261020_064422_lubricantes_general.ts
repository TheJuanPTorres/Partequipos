import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Página general de lubricantes (`/lubricantes/`, plantilla de Andrés 809451,
 * 2026-10-20). Solo esquema: el grupo «Lubricantes» de «Páginas índice y
 * contacto» (vacío, el código usa los textos del diseño) y el «Enlace en el
 * menú» de cada categoría de lubricante (vacío, su ancla en la página de la
 * marca). Nada cambia en el sitio hasta que alguien escriba en el panel.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_lubricante" ADD COLUMN "enlace_menu" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_antetitulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_titulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_fondo_id" integer;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_titulo_bloque" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_texto_bloque" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_marca_id" integer;
  ALTER TABLE "paginas_indice" ADD COLUMN "lubricantes_texto_boton" varchar;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_lubricantes_fondo_id_media_id_fk" FOREIGN KEY ("lubricantes_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_lubricantes_marca_id_marcas_lubricante_id_fk" FOREIGN KEY ("lubricantes_marca_id") REFERENCES "public"."marcas_lubricante"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_indice_lubricantes_lubricantes_fondo_idx" ON "paginas_indice" USING btree ("lubricantes_fondo_id");
  CREATE INDEX "paginas_indice_lubricantes_lubricantes_marca_idx" ON "paginas_indice" USING btree ("lubricantes_marca_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_lubricantes_fondo_id_media_id_fk";
  
  ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_lubricantes_marca_id_marcas_lubricante_id_fk";
  
  DROP INDEX "paginas_indice_lubricantes_lubricantes_fondo_idx";
  DROP INDEX "paginas_indice_lubricantes_lubricantes_marca_idx";
  ALTER TABLE "categorias_lubricante" DROP COLUMN "enlace_menu";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_antetitulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_titulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_fondo_id";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_titulo_bloque";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_texto_bloque";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_marca_id";
  ALTER TABLE "paginas_indice" DROP COLUMN "lubricantes_texto_boton";`)
}
