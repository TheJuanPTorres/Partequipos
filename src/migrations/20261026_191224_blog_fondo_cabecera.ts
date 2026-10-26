import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" ADD COLUMN "blog_fondo_id" integer;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_blog_fondo_id_media_id_fk" FOREIGN KEY ("blog_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_indice_blog_blog_fondo_idx" ON "paginas_indice" USING btree ("blog_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_blog_fondo_id_media_id_fk";
  
  DROP INDEX "paginas_indice_blog_blog_fondo_idx";
  ALTER TABLE "paginas_indice" DROP COLUMN "blog_fondo_id";`)
}
