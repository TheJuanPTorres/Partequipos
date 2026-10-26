import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_marcas_maquinaria_diseno_pagina" ADD VALUE 'kit';
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "kit_foto_cabecera_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "kit_emblema_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "kit_mostrar_emblema" boolean DEFAULT false;
  ALTER TABLE "tipos_maquinaria" ADD COLUMN "render_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_kit_foto_cabecera_id_media_id_fk" FOREIGN KEY ("kit_foto_cabecera_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_kit_emblema_id_media_id_fk" FOREIGN KEY ("kit_emblema_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_maquinaria" ADD CONSTRAINT "tipos_maquinaria_render_id_media_id_fk" FOREIGN KEY ("render_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_maquinaria_kit_kit_foto_cabecera_idx" ON "marcas_maquinaria" USING btree ("kit_foto_cabecera_id");
  CREATE INDEX "marcas_maquinaria_kit_kit_emblema_idx" ON "marcas_maquinaria" USING btree ("kit_emblema_id");
  CREATE INDEX "tipos_maquinaria_render_idx" ON "tipos_maquinaria" USING btree ("render_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_kit_foto_cabecera_id_media_id_fk";
  
  ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_kit_emblema_id_media_id_fk";
  
  ALTER TABLE "tipos_maquinaria" DROP CONSTRAINT "tipos_maquinaria_render_id_media_id_fk";
  
  ALTER TABLE "marcas_maquinaria" ALTER COLUMN "diseno_pagina" SET DATA TYPE text;
  ALTER TABLE "marcas_maquinaria" ALTER COLUMN "diseno_pagina" SET DEFAULT 'plantilla1'::text;
  DROP TYPE "public"."enum_marcas_maquinaria_diseno_pagina";
  CREATE TYPE "public"."enum_marcas_maquinaria_diseno_pagina" AS ENUM('plantilla1', 'aditamentos');
  ALTER TABLE "marcas_maquinaria" ALTER COLUMN "diseno_pagina" SET DEFAULT 'plantilla1'::"public"."enum_marcas_maquinaria_diseno_pagina";
  ALTER TABLE "marcas_maquinaria" ALTER COLUMN "diseno_pagina" SET DATA TYPE "public"."enum_marcas_maquinaria_diseno_pagina" USING "diseno_pagina"::"public"."enum_marcas_maquinaria_diseno_pagina";
  DROP INDEX "marcas_maquinaria_kit_kit_foto_cabecera_idx";
  DROP INDEX "marcas_maquinaria_kit_kit_emblema_idx";
  DROP INDEX "tipos_maquinaria_render_idx";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "kit_foto_cabecera_id";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "kit_emblema_id";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "kit_mostrar_emblema";
  ALTER TABLE "tipos_maquinaria" DROP COLUMN "render_id";`)
}
