import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * SMTP desde el panel («Correo y formularios», 2026-10-27): servidor, cifrado, puerto, usuario,
 * contraseña CIFRADA (con su indicador «guardada») y remitente. Solo esquema: todo empieza vacío,
 * así que hasta que un administrador lo rellene siguen mandando las variables de Vercel.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_correo_formularios_smtp_panel_cifrado" AS ENUM('starttls', 'ssl', 'ninguno');
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_servidor" varchar;
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_cifrado" "enum_correo_formularios_smtp_panel_cifrado" DEFAULT 'starttls';
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_puerto" numeric;
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_usuario" varchar;
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_contrasena_guardada" boolean DEFAULT false;
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_contrasena_cifrada" varchar;
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_remitente_correo" varchar;
  ALTER TABLE "correo_formularios" ADD COLUMN "smtp_panel_remitente_nombre" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_servidor";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_cifrado";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_puerto";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_usuario";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_contrasena_guardada";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_contrasena_cifrada";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_remitente_correo";
  ALTER TABLE "correo_formularios" DROP COLUMN "smtp_panel_remitente_nombre";
  DROP TYPE "public"."enum_correo_formularios_smtp_panel_cifrado";`)
}
