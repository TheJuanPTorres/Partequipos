import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Global «Correo y formularios» (2026-10-26). Mueve el «Correo para hojas de vida» de
 * «Páginas índice y contacto» → «Trabaja con nosotros» al global nuevo CON SU VALOR, antes de
 * quitar la columna vieja. SQL explícito, sin la API local (CLAUDE.md §3.5). Una sola fila,
 * aunque `paginas_indice` esté vacía (base nueva): el valor queda en NULL.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "correo_formularios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"correo_solicitudes" varchar,
  	"correo_hojas_de_vida" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  INSERT INTO "correo_formularios" ("correo_hojas_de_vida", "updated_at", "created_at")
  VALUES (
    (SELECT "trabaja_correo_hojas_de_vida" FROM "paginas_indice" ORDER BY "id" LIMIT 1),
    now(),
    now()
  );

  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_correo_hojas_de_vida";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_correo_hojas_de_vida" varchar;

  UPDATE "paginas_indice"
  SET "trabaja_correo_hojas_de_vida" =
    (SELECT "correo_hojas_de_vida" FROM "correo_formularios" ORDER BY "id" LIMIT 1);

  DROP TABLE "correo_formularios" CASCADE;`)
}
