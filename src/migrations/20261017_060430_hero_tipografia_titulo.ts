import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_paginas_hero_diapositivas_tipografia_peso" AS ENUM('100', '200', '300', '400', '500', '600', '700', '800', '900');
  CREATE TYPE "public"."enum_paginas_hero_diapositivas_tipografia_mayusculas" AS ENUM('mayusculas', 'normal', 'minusculas', 'palabras');
  CREATE TYPE "public"."enum_paginas_hero_diapositivas_tipografia_alineacion" AS ENUM('izquierda', 'centro', 'derecha');
  CREATE TYPE "public"."enum_fuentes_formato" AS ENUM('woff2', 'woff', 'truetype');
  CREATE TABLE "fuentes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"formato" "enum_fuentes_formato",
  	"actualizado_por_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_fuente_id" integer;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_peso" "enum_paginas_hero_diapositivas_tipografia_peso";
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_tamano_escritorio" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_tamano_tablet" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_tamano_movil" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_interlineado" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_interletrado" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_color" varchar;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_mayusculas" "enum_paginas_hero_diapositivas_tipografia_mayusculas";
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_alineacion" "enum_paginas_hero_diapositivas_tipografia_alineacion";
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_posicion_x_escritorio" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_posicion_y_escritorio" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_posicion_x_tablet" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_posicion_y_tablet" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_posicion_x_movil" numeric;
  ALTER TABLE "paginas_hero_diapositivas" ADD COLUMN "tipografia_posicion_y_movil" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fuentes_id" integer;
  ALTER TABLE "fuentes" ADD CONSTRAINT "fuentes_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "fuentes_nombre_idx" ON "fuentes" USING btree ("nombre");
  CREATE INDEX "fuentes_actualizado_por_idx" ON "fuentes" USING btree ("actualizado_por_id");
  CREATE INDEX "fuentes_updated_at_idx" ON "fuentes" USING btree ("updated_at");
  CREATE INDEX "fuentes_created_at_idx" ON "fuentes" USING btree ("created_at");
  CREATE UNIQUE INDEX "fuentes_filename_idx" ON "fuentes" USING btree ("filename");
  ALTER TABLE "paginas_hero_diapositivas" ADD CONSTRAINT "paginas_hero_diapositivas_tipografia_fuente_id_fuentes_id_fk" FOREIGN KEY ("tipografia_fuente_id") REFERENCES "public"."fuentes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fuentes_fk" FOREIGN KEY ("fuentes_id") REFERENCES "public"."fuentes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_hero_diapositivas_tipografia_tipografia_fuente_idx" ON "paginas_hero_diapositivas" USING btree ("tipografia_fuente_id");
  CREATE INDEX "payload_locked_documents_rels_fuentes_id_idx" ON "payload_locked_documents_rels" USING btree ("fuentes_id");`)
}

// `IF EXISTS` en las restricciones e índices: el `DROP TABLE "fuentes" CASCADE` ya se
// lleva las claves foráneas que apuntan a ella, y sin él la reversión fallaba (como en
// `20261014_020810_marcas_usada`, CLAUDE.md §10).
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "fuentes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "fuentes" CASCADE;
  ALTER TABLE "paginas_hero_diapositivas" DROP CONSTRAINT IF EXISTS "paginas_hero_diapositivas_tipografia_fuente_id_fuentes_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_fuentes_fk";
  
  DROP INDEX IF EXISTS "paginas_hero_diapositivas_tipografia_tipografia_fuente_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_fuentes_id_idx";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_fuente_id";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_peso";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_tamano_escritorio";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_tamano_tablet";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_tamano_movil";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_interlineado";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_interletrado";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_color";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_mayusculas";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_alineacion";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_posicion_x_escritorio";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_posicion_y_escritorio";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_posicion_x_tablet";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_posicion_y_tablet";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_posicion_x_movil";
  ALTER TABLE "paginas_hero_diapositivas" DROP COLUMN "tipografia_posicion_y_movil";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "fuentes_id";
  DROP TYPE "public"."enum_paginas_hero_diapositivas_tipografia_peso";
  DROP TYPE "public"."enum_paginas_hero_diapositivas_tipografia_mayusculas";
  DROP TYPE "public"."enum_paginas_hero_diapositivas_tipografia_alineacion";
  DROP TYPE "public"."enum_fuentes_formato";`)
}
