import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_usada" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_antetitulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_titulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_texto" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "usada_fondo_id" integer;
  ALTER TABLE "categorias_usada" ADD CONSTRAINT "categorias_usada_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_usada_fondo_id_media_id_fk" FOREIGN KEY ("usada_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_usada_imagen_idx" ON "categorias_usada" USING btree ("imagen_id");
  CREATE INDEX "paginas_indice_usada_usada_fondo_idx" ON "paginas_indice" USING btree ("usada_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_usada" DROP CONSTRAINT "categorias_usada_imagen_id_media_id_fk";
  
  ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_usada_fondo_id_media_id_fk";
  
  DROP INDEX "categorias_usada_imagen_idx";
  DROP INDEX "paginas_indice_usada_usada_fondo_idx";
  ALTER TABLE "categorias_usada" DROP COLUMN "imagen_id";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_antetitulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_titulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_texto";
  ALTER TABLE "paginas_indice" DROP COLUMN "usada_fondo_id";`)
}
