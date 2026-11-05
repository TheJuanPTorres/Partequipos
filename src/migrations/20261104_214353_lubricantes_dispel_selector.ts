import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_marcas_lubricante_destino" AS ENUM('pagina', 'externo');
  CREATE TYPE "public"."enum_marcas_lubricante_pais_origen" AS ENUM('it', 'co', 'de', 'us', 'gb', 'nl', 'fr', 'es', 'jp', 'kr', 'cn', 'br');
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "selector_marcas_activo" boolean DEFAULT false;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "selector_marcas_titulo" varchar;
  ALTER TABLE "categorias_tecnicas_rels" ADD COLUMN "marcas_lubricante_id" integer;
  ALTER TABLE "marcas_lubricante" ADD COLUMN "destino" "enum_marcas_lubricante_destino" DEFAULT 'pagina';
  ALTER TABLE "marcas_lubricante" ADD COLUMN "enlace_externo" varchar;
  ALTER TABLE "marcas_lubricante" ADD COLUMN "pais_origen" "enum_marcas_lubricante_pais_origen";
  ALTER TABLE "marcas_lubricante" ADD COLUMN "foto_selector_id" integer;
  ALTER TABLE "marcas_lubricante" ADD COLUMN "texto_selector" varchar;
  ALTER TABLE "categorias_tecnicas_rels" ADD CONSTRAINT "categorias_tecnicas_rels_marcas_lubricante_fk" FOREIGN KEY ("marcas_lubricante_id") REFERENCES "public"."marcas_lubricante"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "marcas_lubricante" ADD CONSTRAINT "marcas_lubricante_foto_selector_id_media_id_fk" FOREIGN KEY ("foto_selector_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_rels_marcas_lubricante_id_idx" ON "categorias_tecnicas_rels" USING btree ("marcas_lubricante_id");
  CREATE INDEX "marcas_lubricante_foto_selector_idx" ON "marcas_lubricante" USING btree ("foto_selector_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas_rels" DROP CONSTRAINT "categorias_tecnicas_rels_marcas_lubricante_fk";
  
  ALTER TABLE "marcas_lubricante" DROP CONSTRAINT "marcas_lubricante_foto_selector_id_media_id_fk";
  
  DROP INDEX "categorias_tecnicas_rels_marcas_lubricante_id_idx";
  DROP INDEX "marcas_lubricante_foto_selector_idx";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "selector_marcas_activo";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "selector_marcas_titulo";
  ALTER TABLE "categorias_tecnicas_rels" DROP COLUMN "marcas_lubricante_id";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "destino";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "enlace_externo";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "pais_origen";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "foto_selector_id";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "texto_selector";
  DROP TYPE "public"."enum_marcas_lubricante_destino";
  DROP TYPE "public"."enum_marcas_lubricante_pais_origen";`)
}
