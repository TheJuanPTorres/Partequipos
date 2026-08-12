import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_solicitudes_tipo" AS ENUM('contacto', 'cotizacion', 'repuesto');
  CREATE TYPE "public"."enum_solicitudes_estado" AS ENUM('nueva', 'atendida');
  CREATE TABLE "solicitudes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tipo" "enum_solicitudes_tipo" DEFAULT 'contacto' NOT NULL,
  	"estado" "enum_solicitudes_estado" DEFAULT 'nueva' NOT NULL,
  	"nombre" varchar NOT NULL,
  	"correo" varchar NOT NULL,
  	"telefono" varchar,
  	"empresa" varchar,
  	"mensaje" varchar NOT NULL,
  	"referencia_texto" varchar,
  	"origen" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "solicitudes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"equipos_nuevos_id" integer,
  	"modelos_repuesto_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "solicitudes_id" integer;
  ALTER TABLE "solicitudes_rels" ADD CONSTRAINT "solicitudes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."solicitudes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solicitudes_rels" ADD CONSTRAINT "solicitudes_rels_equipos_nuevos_fk" FOREIGN KEY ("equipos_nuevos_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "solicitudes_rels" ADD CONSTRAINT "solicitudes_rels_modelos_repuesto_fk" FOREIGN KEY ("modelos_repuesto_id") REFERENCES "public"."modelos_repuesto"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "solicitudes_updated_at_idx" ON "solicitudes" USING btree ("updated_at");
  CREATE INDEX "solicitudes_created_at_idx" ON "solicitudes" USING btree ("created_at");
  CREATE INDEX "solicitudes_rels_order_idx" ON "solicitudes_rels" USING btree ("order");
  CREATE INDEX "solicitudes_rels_parent_idx" ON "solicitudes_rels" USING btree ("parent_id");
  CREATE INDEX "solicitudes_rels_path_idx" ON "solicitudes_rels" USING btree ("path");
  CREATE INDEX "solicitudes_rels_equipos_nuevos_id_idx" ON "solicitudes_rels" USING btree ("equipos_nuevos_id");
  CREATE INDEX "solicitudes_rels_modelos_repuesto_id_idx" ON "solicitudes_rels" USING btree ("modelos_repuesto_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_solicitudes_fk" FOREIGN KEY ("solicitudes_id") REFERENCES "public"."solicitudes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_solicitudes_id_idx" ON "payload_locked_documents_rels" USING btree ("solicitudes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solicitudes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "solicitudes_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "solicitudes" CASCADE;
  DROP TABLE "solicitudes_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_solicitudes_fk";
  
  DROP INDEX "payload_locked_documents_rels_solicitudes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "solicitudes_id";
  DROP TYPE "public"."enum_solicitudes_tipo";
  DROP TYPE "public"."enum_solicitudes_estado";`)
}
