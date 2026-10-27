import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_maquina_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_nueva_fondo_id" integer;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_nueva_maquina_id_media_id_fk" FOREIGN KEY ("seccion_nueva_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_nueva_fondo_id_media_id_fk" FOREIGN KEY ("seccion_nueva_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_nueva_seccion_nueva_maquina_idx" ON "paginas" USING btree ("seccion_nueva_maquina_id");
  CREATE INDEX "paginas_seccion_nueva_seccion_nueva_fondo_idx" ON "paginas" USING btree ("seccion_nueva_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_nueva_maquina_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_nueva_fondo_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_nueva_seccion_nueva_maquina_idx";
  DROP INDEX "paginas_seccion_nueva_seccion_nueva_fondo_idx";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_maquina_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_nueva_fondo_id";`)
}
