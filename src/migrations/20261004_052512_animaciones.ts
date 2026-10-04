import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "animaciones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"descripcion" varchar NOT NULL,
  	"ancho" numeric,
  	"alto" numeric,
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
  
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD COLUMN "lottie_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "animaciones_id" integer;
  CREATE INDEX "animaciones_updated_at_idx" ON "animaciones" USING btree ("updated_at");
  CREATE INDEX "animaciones_created_at_idx" ON "animaciones" USING btree ("created_at");
  CREATE UNIQUE INDEX "animaciones_filename_idx" ON "animaciones" USING btree ("filename");
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD CONSTRAINT "paginas_blocks_presentacion_imagen_lottie_id_animaciones_id_fk" FOREIGN KEY ("lottie_id") REFERENCES "public"."animaciones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_animaciones_fk" FOREIGN KEY ("animaciones_id") REFERENCES "public"."animaciones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_presentacion_imagen_lottie_idx" ON "paginas_blocks_presentacion_imagen" USING btree ("lottie_id");
  CREATE INDEX "payload_locked_documents_rels_animaciones_id_idx" ON "payload_locked_documents_rels" USING btree ("animaciones_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Orden corregido a mano: primero las claves foráneas, índices y columnas que
  // apuntan a «animaciones», y la tabla al final. El generado la borraba con
  // CASCADE antes, y el DROP CONSTRAINT siguiente fallaba por no existir.
  await db.execute(sql`
   ALTER TABLE "paginas_blocks_presentacion_imagen" DROP CONSTRAINT "paginas_blocks_presentacion_imagen_lottie_id_animaciones_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_animaciones_fk";
  DROP INDEX "paginas_blocks_presentacion_imagen_lottie_idx";
  DROP INDEX "payload_locked_documents_rels_animaciones_id_idx";
  ALTER TABLE "paginas_blocks_presentacion_imagen" DROP COLUMN "lottie_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "animaciones_id";
  DROP TABLE "animaciones";`)
}
