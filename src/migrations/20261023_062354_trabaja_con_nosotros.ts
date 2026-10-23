import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "vacantes_buk" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"leer" boolean DEFAULT true,
  	"copia_el" timestamp(3) with time zone,
  	"numero_vacantes" numeric,
  	"ultimo_intento" timestamp(3) with time zone,
  	"ultimo_error" varchar,
  	"vacantes" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_antetitulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_titulo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_fondo_id" integer;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_titulo_equipo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_texto_equipo" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_titulo_hoja_de_vida" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_texto_hoja_de_vida" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_boton_hoja_de_vida" varchar;
  ALTER TABLE "paginas_indice" ADD COLUMN "trabaja_imagen_hoja_de_vida_id" integer;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_trabaja_fondo_id_media_id_fk" FOREIGN KEY ("trabaja_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_indice" ADD CONSTRAINT "paginas_indice_trabaja_imagen_hoja_de_vida_id_media_id_fk" FOREIGN KEY ("trabaja_imagen_hoja_de_vida_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_indice_trabaja_trabaja_fondo_idx" ON "paginas_indice" USING btree ("trabaja_fondo_id");
  CREATE INDEX "paginas_indice_trabaja_trabaja_imagen_hoja_de_vida_idx" ON "paginas_indice" USING btree ("trabaja_imagen_hoja_de_vida_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vacantes_buk" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vacantes_buk" CASCADE;
  ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_trabaja_fondo_id_media_id_fk";
  
  ALTER TABLE "paginas_indice" DROP CONSTRAINT "paginas_indice_trabaja_imagen_hoja_de_vida_id_media_id_fk";
  
  DROP INDEX "paginas_indice_trabaja_trabaja_fondo_idx";
  DROP INDEX "paginas_indice_trabaja_trabaja_imagen_hoja_de_vida_idx";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_antetitulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_titulo";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_fondo_id";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_titulo_equipo";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_texto_equipo";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_titulo_hoja_de_vida";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_texto_hoja_de_vida";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_boton_hoja_de_vida";
  ALTER TABLE "paginas_indice" DROP COLUMN "trabaja_imagen_hoja_de_vida_id";`)
}
