import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas_grupos" ADD COLUMN "descripcion" varchar;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "padre_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "logo_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "color_marca" varchar;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_padre_id_categorias_tecnicas_id_fk" FOREIGN KEY ("padre_id") REFERENCES "public"."categorias_tecnicas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_padre_idx" ON "categorias_tecnicas" USING btree ("padre_id");
  CREATE INDEX "categorias_tecnicas_logo_idx" ON "categorias_tecnicas" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_padre_id_categorias_tecnicas_id_fk";
  
  ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_logo_id_media_id_fk";
  
  DROP INDEX "categorias_tecnicas_padre_idx";
  DROP INDEX "categorias_tecnicas_logo_idx";
  ALTER TABLE "categorias_tecnicas_grupos" DROP COLUMN "descripcion";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "padre_id";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "logo_id";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "color_marca";`)
}
