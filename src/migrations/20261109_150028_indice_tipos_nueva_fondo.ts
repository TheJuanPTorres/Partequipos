import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" ADD COLUMN "nueva_tipos_fondo_id" integer;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_nueva_tipos_fondo_id_media_id_fk" FOREIGN KEY ("nueva_tipos_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_indice_nueva_tipos_nueva_tipos_fondo_idx" ON "paginas_indice" USING btree ("nueva_tipos_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_nueva_tipos_fondo_id_media_id_fk";
  
  DROP INDEX "paginas_indice_nueva_tipos_nueva_tipos_fondo_idx";
  ALTER TABLE "paginas_indice" DROP COLUMN "nueva_tipos_fondo_id";`)
}
