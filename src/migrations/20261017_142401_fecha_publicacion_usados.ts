import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_usados" ADD COLUMN "fecha_publicacion" timestamp(3) with time zone;
  -- Las unidades que ya existen publican desde su fecha de creación (el importador de
  -- WordPress la sustituye después por la fecha original de cada anuncio).
  UPDATE "equipos_usados" SET "fecha_publicacion" = "created_at" WHERE "fecha_publicacion" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipos_usados" DROP COLUMN "fecha_publicacion";`)
}
