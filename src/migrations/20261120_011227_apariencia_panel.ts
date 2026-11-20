import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Global «Apariencia del panel» (2026-11-19, plan §7.4). Crea su tabla y COPIA la «Imagen de la
 * pantalla de acceso» elegida hoy en el global `seo`, para que no se pierda en producción.
 * SQL explícito, sin la API local (CLAUDE.md §3.5). Una sola fila, aunque `seo` esté vacía (base
 * nueva): la imagen queda en NULL y la pantalla de acceso pinta el degradado de siempre.
 *
 * La columna `seo.imagen_acceso_id` NO se borra: el campo queda oculto y sin uso hasta quitarlo
 * con su propia migración.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "apariencia_panel" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"imagen_acceso_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "apariencia_panel" ADD CONSTRAINT "apariencia_panel_imagen_acceso_id_media_id_fk" FOREIGN KEY ("imagen_acceso_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "apariencia_panel_imagen_acceso_idx" ON "apariencia_panel" USING btree ("imagen_acceso_id");

  INSERT INTO "apariencia_panel" ("imagen_acceso_id", "updated_at", "created_at")
  VALUES (
    (SELECT "imagen_acceso_id" FROM "seo" ORDER BY "id" LIMIT 1),
    now(),
    now()
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "apariencia_panel" CASCADE;`)
}
