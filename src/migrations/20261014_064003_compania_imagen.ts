import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_compania_imagen_id" integer;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_compania_imagen_id_media_id_fk" FOREIGN KEY ("seccion_compania_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_compania_seccion_compania_imagen_idx" ON "paginas" USING btree ("seccion_compania_imagen_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_compania_imagen_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_compania_seccion_compania_imagen_idx";
  ALTER TABLE "paginas" DROP COLUMN "seccion_compania_imagen_id";`)
}
