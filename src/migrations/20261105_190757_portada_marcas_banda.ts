import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_rels" ADD COLUMN "marcas_id" integer;
  ALTER TABLE "paginas_rels" ADD CONSTRAINT "paginas_rels_marcas_fk" FOREIGN KEY ("marcas_id") REFERENCES "public"."marcas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_rels_marcas_id_idx" ON "paginas_rels" USING btree ("marcas_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_rels" DROP CONSTRAINT "paginas_rels_marcas_fk";
  
  DROP INDEX "paginas_rels_marcas_id_idx";
  ALTER TABLE "paginas_rels" DROP COLUMN "marcas_id";`)
}
