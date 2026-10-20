import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" ADD COLUMN "fondo_hero_id" integer;
  ALTER TABLE "paginas_indice" ADD COLUMN "categorias_repuestos_fondo_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_fondo_hero_id_media_id_fk" FOREIGN KEY ("fondo_hero_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_categorias_repuestos_fondo_id_media_id_fk" FOREIGN KEY ("categorias_repuestos_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_fondo_hero_idx" ON "categorias_tecnicas" USING btree ("fondo_hero_id");
  CREATE INDEX "paginas_indice_categorias_repuestos_categorias_repuestos_idx" ON "paginas_indice" USING btree ("categorias_repuestos_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_fondo_hero_id_media_id_fk";
  
  ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_categorias_repuestos_fondo_id_media_id_fk";
  
  DROP INDEX "categorias_tecnicas_fondo_hero_idx";
  DROP INDEX "paginas_indice_categorias_repuestos_categorias_repuestos_idx";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "fondo_hero_id";
  ALTER TABLE "paginas_indice" DROP COLUMN "categorias_repuestos_fondo_id";`)
}
