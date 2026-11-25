import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_atributos_ficha_icono" AS ENUM('peso', 'potencia', 'motor', 'capacidad', 'alcance', 'profundidad', 'velocidad', 'otro');
  CREATE TYPE "public"."enum_atributos_ficha_tipo_valor" AS ENUM('numero', 'texto');
  CREATE TABLE "equipos_nuevos_atributos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"atributo_id" integer NOT NULL,
  	"valor" varchar NOT NULL
  );
  
  CREATE TABLE "_equipos_nuevos_atributos_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"atributo_id" integer NOT NULL,
  	"valor" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "atributos_ficha" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"titulo" varchar,
  	"nombre" varchar NOT NULL,
  	"icono" "enum_atributos_ficha_icono" DEFAULT 'otro' NOT NULL,
  	"unidad" varchar,
  	"tipo_valor" "enum_atributos_ficha_tipo_valor" DEFAULT 'numero' NOT NULL,
  	"actualizado_por_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "atributos_ficha_id" integer;
  ALTER TABLE "equipos_nuevos_atributos" ADD CONSTRAINT "equipos_nuevos_atributos_atributo_id_atributos_ficha_id_fk" FOREIGN KEY ("atributo_id") REFERENCES "public"."atributos_ficha"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_nuevos_atributos" ADD CONSTRAINT "equipos_nuevos_atributos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipos_nuevos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_atributos_v" ADD CONSTRAINT "_equipos_nuevos_atributos_v_atributo_id_atributos_ficha_id_fk" FOREIGN KEY ("atributo_id") REFERENCES "public"."atributos_ficha"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_equipos_nuevos_atributos_v" ADD CONSTRAINT "_equipos_nuevos_atributos_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_equipos_nuevos_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "atributos_ficha" ADD CONSTRAINT "atributos_ficha_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "equipos_nuevos_atributos_order_idx" ON "equipos_nuevos_atributos" USING btree ("_order");
  CREATE INDEX "equipos_nuevos_atributos_parent_id_idx" ON "equipos_nuevos_atributos" USING btree ("_parent_id");
  CREATE INDEX "equipos_nuevos_atributos_atributo_idx" ON "equipos_nuevos_atributos" USING btree ("atributo_id");
  CREATE INDEX "_equipos_nuevos_atributos_v_order_idx" ON "_equipos_nuevos_atributos_v" USING btree ("_order");
  CREATE INDEX "_equipos_nuevos_atributos_v_parent_id_idx" ON "_equipos_nuevos_atributos_v" USING btree ("_parent_id");
  CREATE INDEX "_equipos_nuevos_atributos_v_atributo_idx" ON "_equipos_nuevos_atributos_v" USING btree ("atributo_id");
  CREATE INDEX "atributos_ficha__order_idx" ON "atributos_ficha" USING btree ("_order");
  CREATE INDEX "atributos_ficha_actualizado_por_idx" ON "atributos_ficha" USING btree ("actualizado_por_id");
  CREATE INDEX "atributos_ficha_updated_at_idx" ON "atributos_ficha" USING btree ("updated_at");
  CREATE INDEX "atributos_ficha_created_at_idx" ON "atributos_ficha" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_atributos_ficha_fk" FOREIGN KEY ("atributos_ficha_id") REFERENCES "public"."atributos_ficha"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_atributos_ficha_id_idx" ON "payload_locked_documents_rels" USING btree ("atributos_ficha_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_nuevos_atributos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_equipos_nuevos_atributos_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "atributos_ficha" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "equipos_nuevos_atributos" CASCADE;
  DROP TABLE "_equipos_nuevos_atributos_v" CASCADE;
  DROP TABLE "atributos_ficha" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_atributos_ficha_fk";
  
  DROP INDEX "payload_locked_documents_rels_atributos_ficha_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "atributos_ficha_id";
  DROP TYPE "public"."enum_atributos_ficha_icono";
  DROP TYPE "public"."enum_atributos_ficha_tipo_valor";`)
}
