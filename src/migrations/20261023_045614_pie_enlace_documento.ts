import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pie_columnas_enlaces_tipo" ADD VALUE 'documento';
  ALTER TABLE "pie_columnas_enlaces" ADD COLUMN "documento_id" integer;
  ALTER TABLE "pie_columnas_enlaces" ADD CONSTRAINT "pie_columnas_enlaces_documento_id_documentos_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pie_columnas_enlaces_documento_idx" ON "pie_columnas_enlaces" USING btree ("documento_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Los enlaces «Documento en el visor» no caben en el tipo de antes: se quitan.
  await db.execute(sql`
   DELETE FROM "pie_columnas_enlaces" WHERE "tipo" = 'documento';
  ALTER TABLE "pie_columnas_enlaces" DROP CONSTRAINT "pie_columnas_enlaces_documento_id_documentos_id_fk";
  
  ALTER TABLE "pie_columnas_enlaces" ALTER COLUMN "tipo" SET DATA TYPE text;
  ALTER TABLE "pie_columnas_enlaces" ALTER COLUMN "tipo" SET DEFAULT 'pagina'::text;
  DROP TYPE "public"."enum_pie_columnas_enlaces_tipo";
  CREATE TYPE "public"."enum_pie_columnas_enlaces_tipo" AS ENUM('pagina', 'telefono');
  ALTER TABLE "pie_columnas_enlaces" ALTER COLUMN "tipo" SET DEFAULT 'pagina'::"public"."enum_pie_columnas_enlaces_tipo";
  ALTER TABLE "pie_columnas_enlaces" ALTER COLUMN "tipo" SET DATA TYPE "public"."enum_pie_columnas_enlaces_tipo" USING "tipo"::"public"."enum_pie_columnas_enlaces_tipo";
  DROP INDEX "pie_columnas_enlaces_documento_idx";
  ALTER TABLE "pie_columnas_enlaces" DROP COLUMN "documento_id";`)
}
