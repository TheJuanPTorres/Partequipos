import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "busquedas_sin_resultado" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto" varchar NOT NULL,
  	"veces" numeric DEFAULT 1,
  	"ultima_vez" timestamp(3) with time zone,
  	"actualizado_por_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "buscador" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sinonimos" varchar,
  	"guardar_sin_resultado" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "busquedas_sin_resultado_id" integer;
  ALTER TABLE "busquedas_sin_resultado" ADD CONSTRAINT "busquedas_sin_resultado_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "busquedas_sin_resultado_texto_idx" ON "busquedas_sin_resultado" USING btree ("texto");
  CREATE INDEX "busquedas_sin_resultado_actualizado_por_idx" ON "busquedas_sin_resultado" USING btree ("actualizado_por_id");
  CREATE INDEX "busquedas_sin_resultado_updated_at_idx" ON "busquedas_sin_resultado" USING btree ("updated_at");
  CREATE INDEX "busquedas_sin_resultado_created_at_idx" ON "busquedas_sin_resultado" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_busquedas_sin_resultado_fk" FOREIGN KEY ("busquedas_sin_resultado_id") REFERENCES "public"."busquedas_sin_resultado"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_busquedas_sin_resultado_id_idx" ON "payload_locked_documents_rels" USING btree ("busquedas_sin_resultado_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "busquedas_sin_resultado" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "buscador" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "busquedas_sin_resultado" CASCADE;
  DROP TABLE "buscador" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_busquedas_sin_resultado_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_busquedas_sin_resultado_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "busquedas_sin_resultado_id";`)
}
