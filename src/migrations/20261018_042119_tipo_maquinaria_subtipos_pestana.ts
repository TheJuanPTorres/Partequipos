import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tipos_maquinaria_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tipos_maquinaria_id" integer
  );
  
  ALTER TABLE "tipos_maquinaria" ADD COLUMN "pestana_indice_nueva" boolean DEFAULT false;
  ALTER TABLE "tipos_maquinaria_rels" ADD CONSTRAINT "tipos_maquinaria_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tipos_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tipos_maquinaria_rels" ADD CONSTRAINT "tipos_maquinaria_rels_tipos_maquinaria_fk" FOREIGN KEY ("tipos_maquinaria_id") REFERENCES "public"."tipos_maquinaria"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tipos_maquinaria_rels_order_idx" ON "tipos_maquinaria_rels" USING btree ("order");
  CREATE INDEX "tipos_maquinaria_rels_parent_idx" ON "tipos_maquinaria_rels" USING btree ("parent_id");
  CREATE INDEX "tipos_maquinaria_rels_path_idx" ON "tipos_maquinaria_rels" USING btree ("path");
  CREATE INDEX "tipos_maquinaria_rels_tipos_maquinaria_id_idx" ON "tipos_maquinaria_rels" USING btree ("tipos_maquinaria_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "tipos_maquinaria_rels" CASCADE;
  ALTER TABLE "tipos_maquinaria" DROP COLUMN IF EXISTS "pestana_indice_nueva";`)
}
