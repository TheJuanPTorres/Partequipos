import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" ADD COLUMN "imagen_portada_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_descripcion" varchar DEFAULT 'Encuentra excavadoras, retrocargadoras, cargadores, minicargadores, motoniveladoras y más para construcción, infraestructura y movimiento de tierra en Colombia.';
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_imagen_excavadoras_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_imagen_otros_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_usada_imagen_aditamentos_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_logos_titulo" varchar DEFAULT 'Marcas que mueven';
  ALTER TABLE "paginas" ADD COLUMN "seccion_logos_titulo_resaltado" varchar DEFAULT 'tu operación';
  ALTER TABLE "paginas" ADD COLUMN "seccion_logos_maquina_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_logos_maquina_reflejo_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_maquina_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "seccion_repuestos_maquina_reflejo_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_imagen_portada_id_media_id_fk" FOREIGN KEY ("imagen_portada_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_imagen_excavadoras_id_media_id_fk" FOREIGN KEY ("seccion_usada_imagen_excavadoras_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_imagen_otros_id_media_id_fk" FOREIGN KEY ("seccion_usada_imagen_otros_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_imagen_aditamentos_id_media_id_fk" FOREIGN KEY ("seccion_usada_imagen_aditamentos_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_logos_maquina_id_media_id_fk" FOREIGN KEY ("seccion_logos_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_logos_maquina_reflejo_id_media_id_fk" FOREIGN KEY ("seccion_logos_maquina_reflejo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_repuestos_maquina_id_media_id_fk" FOREIGN KEY ("seccion_repuestos_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_repuestos_maquina_reflejo_id_media_id_fk" FOREIGN KEY ("seccion_repuestos_maquina_reflejo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_imagen_portada_idx" ON "categorias_tecnicas" USING btree ("imagen_portada_id");
  CREATE INDEX "paginas_seccion_usada_seccion_usada_imagen_excavadoras_idx" ON "paginas" USING btree ("seccion_usada_imagen_excavadoras_id");
  CREATE INDEX "paginas_seccion_usada_seccion_usada_imagen_otros_idx" ON "paginas" USING btree ("seccion_usada_imagen_otros_id");
  CREATE INDEX "paginas_seccion_usada_seccion_usada_imagen_aditamentos_idx" ON "paginas" USING btree ("seccion_usada_imagen_aditamentos_id");
  CREATE INDEX "paginas_seccion_logos_seccion_logos_maquina_idx" ON "paginas" USING btree ("seccion_logos_maquina_id");
  CREATE INDEX "paginas_seccion_logos_seccion_logos_maquina_reflejo_idx" ON "paginas" USING btree ("seccion_logos_maquina_reflejo_id");
  CREATE INDEX "paginas_seccion_repuestos_seccion_repuestos_maquina_idx" ON "paginas" USING btree ("seccion_repuestos_maquina_id");
  CREATE INDEX "paginas_seccion_repuestos_seccion_repuestos_maquina_refl_idx" ON "paginas" USING btree ("seccion_repuestos_maquina_reflejo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_imagen_portada_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_imagen_excavadoras_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_imagen_otros_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_imagen_aditamentos_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_logos_maquina_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_logos_maquina_reflejo_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_repuestos_maquina_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_repuestos_maquina_reflejo_id_media_id_fk";
  
  DROP INDEX "categorias_tecnicas_imagen_portada_idx";
  DROP INDEX "paginas_seccion_usada_seccion_usada_imagen_excavadoras_idx";
  DROP INDEX "paginas_seccion_usada_seccion_usada_imagen_otros_idx";
  DROP INDEX "paginas_seccion_usada_seccion_usada_imagen_aditamentos_idx";
  DROP INDEX "paginas_seccion_logos_seccion_logos_maquina_idx";
  DROP INDEX "paginas_seccion_logos_seccion_logos_maquina_reflejo_idx";
  DROP INDEX "paginas_seccion_repuestos_seccion_repuestos_maquina_idx";
  DROP INDEX "paginas_seccion_repuestos_seccion_repuestos_maquina_refl_idx";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "imagen_portada_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_descripcion";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_imagen_excavadoras_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_imagen_otros_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_usada_imagen_aditamentos_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_logos_titulo";
  ALTER TABLE "paginas" DROP COLUMN "seccion_logos_titulo_resaltado";
  ALTER TABLE "paginas" DROP COLUMN "seccion_logos_maquina_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_logos_maquina_reflejo_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_maquina_id";
  ALTER TABLE "paginas" DROP COLUMN "seccion_repuestos_maquina_reflejo_id";`)
}
