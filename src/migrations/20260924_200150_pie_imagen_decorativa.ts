/*
 * Imagen decorativa OPCIONAL del pie (§13). Columna NULLABLE y sin valor por
 * defecto: la fila existente del global queda en NULL, «sin imagen», y la
 * tarjeta se pinta sin ella. Ningún dato cambia de significado.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pie" ADD COLUMN "imagen_decorativa_id" integer;
  ALTER TABLE "pie" ADD CONSTRAINT "pie_imagen_decorativa_id_media_id_fk" FOREIGN KEY ("imagen_decorativa_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pie_imagen_decorativa_idx" ON "pie" USING btree ("imagen_decorativa_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pie" DROP CONSTRAINT "pie_imagen_decorativa_id_media_id_fk";
  
  DROP INDEX "pie_imagen_decorativa_idx";
  ALTER TABLE "pie" DROP COLUMN "imagen_decorativa_id";`)
}
