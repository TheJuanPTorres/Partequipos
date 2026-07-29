import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_tipo_pagina" AS ENUM('institucional', 'legal', 'portada');
  CREATE TABLE "paginas_secciones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"ancla" varchar NOT NULL,
  	"contenido" jsonb
  );
  
  CREATE TABLE "paginas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"tipo_pagina" "enum_paginas_tipo_pagina" DEFAULT 'institucional',
  	"entradilla" varchar,
  	"contenido" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "paginas_id" integer;
  ALTER TABLE "paginas_secciones" ADD CONSTRAINT "paginas_secciones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_secciones_order_idx" ON "paginas_secciones" USING btree ("_order");
  CREATE INDEX "paginas_secciones_parent_id_idx" ON "paginas_secciones" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "paginas_slug_idx" ON "paginas" USING btree ("slug");
  CREATE INDEX "paginas_seo_seo_og_image_idx" ON "paginas" USING btree ("seo_og_image_id");
  CREATE INDEX "paginas_updated_at_idx" ON "paginas" USING btree ("updated_at");
  CREATE INDEX "paginas_created_at_idx" ON "paginas" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_paginas_fk" FOREIGN KEY ("paginas_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_paginas_id_idx" ON "payload_locked_documents_rels" USING btree ("paginas_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_secciones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "paginas_secciones" CASCADE;
  DROP TABLE "paginas" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_paginas_fk";
  
  DROP INDEX "payload_locked_documents_rels_paginas_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "paginas_id";
  DROP TYPE "public"."enum_paginas_tipo_pagina";`)
}
