import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "foto_cabecera_id" integer;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_foto_cabecera_id_media_id_fk" FOREIGN KEY ("foto_cabecera_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_foto_cabecera_idx" ON "paginas" USING btree ("foto_cabecera_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_foto_cabecera_id_media_id_fk";
  
  DROP INDEX "paginas_foto_cabecera_idx";
  ALTER TABLE "paginas" DROP COLUMN "foto_cabecera_id";`)
}
