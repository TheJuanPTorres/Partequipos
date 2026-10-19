import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" ADD COLUMN "mostrar_en_web" boolean DEFAULT true;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "destino_oculta_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_destino_oculta_id_categorias_maquinaria_id_fk" FOREIGN KEY ("destino_oculta_id") REFERENCES "public"."categorias_maquinaria"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_maquinaria_destino_oculta_idx" ON "marcas_maquinaria" USING btree ("destino_oculta_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_destino_oculta_id_categorias_maquinaria_id_fk";
  
  DROP INDEX "marcas_maquinaria_destino_oculta_idx";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "mostrar_en_web";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "destino_oculta_id";`)
}
