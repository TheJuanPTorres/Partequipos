import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "marcas" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "tipos_equipo" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "modelos_repuesto" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "marcas_maquinaria" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "tipos_maquinaria" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "equipos_nuevos" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "categorias_maquinaria" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "categorias_usada" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "equipos_usados" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "marcas_lubricante" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "categorias_lubricante" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "paginas" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "articulos" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "categorias_blog" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "media" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "animaciones" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "documentos" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "videos" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "sedes" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "testimonios" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "preguntas_frecuentes" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "redirects" ADD COLUMN "actualizado_por_id" integer;
  ALTER TABLE "marcas" ADD CONSTRAINT "marcas_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_equipo" ADD CONSTRAINT "tipos_equipo_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "modelos_repuesto" ADD CONSTRAINT "modelos_repuesto_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_maquinaria" ADD CONSTRAINT "marcas_maquinaria_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tipos_maquinaria" ADD CONSTRAINT "tipos_maquinaria_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_nuevos" ADD CONSTRAINT "equipos_nuevos_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_maquinaria" ADD CONSTRAINT "categorias_maquinaria_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_usada" ADD CONSTRAINT "categorias_usada_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipos_usados" ADD CONSTRAINT "equipos_usados_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas_lubricante" ADD CONSTRAINT "marcas_lubricante_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_lubricante" ADD CONSTRAINT "categorias_lubricante_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articulos" ADD CONSTRAINT "articulos_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias_blog" ADD CONSTRAINT "categorias_blog_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "animaciones" ADD CONSTRAINT "animaciones_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documentos" ADD CONSTRAINT "documentos_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "videos" ADD CONSTRAINT "videos_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sedes" ADD CONSTRAINT "sedes_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonios" ADD CONSTRAINT "testimonios_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "preguntas_frecuentes" ADD CONSTRAINT "preguntas_frecuentes_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "redirects" ADD CONSTRAINT "redirects_actualizado_por_id_users_id_fk" FOREIGN KEY ("actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "marcas_actualizado_por_idx" ON "marcas" USING btree ("actualizado_por_id");
  CREATE INDEX "tipos_equipo_actualizado_por_idx" ON "tipos_equipo" USING btree ("actualizado_por_id");
  CREATE INDEX "modelos_repuesto_actualizado_por_idx" ON "modelos_repuesto" USING btree ("actualizado_por_id");
  CREATE INDEX "categorias_tecnicas_actualizado_por_idx" ON "categorias_tecnicas" USING btree ("actualizado_por_id");
  CREATE INDEX "marcas_maquinaria_actualizado_por_idx" ON "marcas_maquinaria" USING btree ("actualizado_por_id");
  CREATE INDEX "tipos_maquinaria_actualizado_por_idx" ON "tipos_maquinaria" USING btree ("actualizado_por_id");
  CREATE INDEX "equipos_nuevos_actualizado_por_idx" ON "equipos_nuevos" USING btree ("actualizado_por_id");
  CREATE INDEX "categorias_maquinaria_actualizado_por_idx" ON "categorias_maquinaria" USING btree ("actualizado_por_id");
  CREATE INDEX "categorias_usada_actualizado_por_idx" ON "categorias_usada" USING btree ("actualizado_por_id");
  CREATE INDEX "equipos_usados_actualizado_por_idx" ON "equipos_usados" USING btree ("actualizado_por_id");
  CREATE INDEX "marcas_lubricante_actualizado_por_idx" ON "marcas_lubricante" USING btree ("actualizado_por_id");
  CREATE INDEX "categorias_lubricante_actualizado_por_idx" ON "categorias_lubricante" USING btree ("actualizado_por_id");
  CREATE INDEX "paginas_actualizado_por_idx" ON "paginas" USING btree ("actualizado_por_id");
  CREATE INDEX "articulos_actualizado_por_idx" ON "articulos" USING btree ("actualizado_por_id");
  CREATE INDEX "categorias_blog_actualizado_por_idx" ON "categorias_blog" USING btree ("actualizado_por_id");
  CREATE INDEX "media_actualizado_por_idx" ON "media" USING btree ("actualizado_por_id");
  CREATE INDEX "animaciones_actualizado_por_idx" ON "animaciones" USING btree ("actualizado_por_id");
  CREATE INDEX "documentos_actualizado_por_idx" ON "documentos" USING btree ("actualizado_por_id");
  CREATE INDEX "videos_actualizado_por_idx" ON "videos" USING btree ("actualizado_por_id");
  CREATE INDEX "sedes_actualizado_por_idx" ON "sedes" USING btree ("actualizado_por_id");
  CREATE INDEX "testimonios_actualizado_por_idx" ON "testimonios" USING btree ("actualizado_por_id");
  CREATE INDEX "preguntas_frecuentes_actualizado_por_idx" ON "preguntas_frecuentes" USING btree ("actualizado_por_id");
  CREATE INDEX "redirects_actualizado_por_idx" ON "redirects" USING btree ("actualizado_por_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "modelos_repuesto" DROP CONSTRAINT "modelos_repuesto_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "marcas" DROP CONSTRAINT "marcas_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "tipos_equipo" DROP CONSTRAINT "tipos_equipo_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "equipos_nuevos" DROP CONSTRAINT "equipos_nuevos_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "equipos_usados" DROP CONSTRAINT "equipos_usados_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "marcas_maquinaria" DROP CONSTRAINT "marcas_maquinaria_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "tipos_maquinaria" DROP CONSTRAINT "tipos_maquinaria_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "categorias_maquinaria" DROP CONSTRAINT "categorias_maquinaria_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "categorias_usada" DROP CONSTRAINT "categorias_usada_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "marcas_lubricante" DROP CONSTRAINT "marcas_lubricante_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "categorias_lubricante" DROP CONSTRAINT "categorias_lubricante_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "articulos" DROP CONSTRAINT "articulos_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "categorias_blog" DROP CONSTRAINT "categorias_blog_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "preguntas_frecuentes" DROP CONSTRAINT "preguntas_frecuentes_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "testimonios" DROP CONSTRAINT "testimonios_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "sedes" DROP CONSTRAINT "sedes_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "media" DROP CONSTRAINT "media_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "documentos" DROP CONSTRAINT "documentos_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "videos" DROP CONSTRAINT "videos_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "animaciones" DROP CONSTRAINT "animaciones_actualizado_por_id_users_id_fk";
  
  ALTER TABLE "redirects" DROP CONSTRAINT "redirects_actualizado_por_id_users_id_fk";
  
  DROP INDEX "modelos_repuesto_actualizado_por_idx";
  DROP INDEX "marcas_actualizado_por_idx";
  DROP INDEX "tipos_equipo_actualizado_por_idx";
  DROP INDEX "categorias_tecnicas_actualizado_por_idx";
  DROP INDEX "equipos_nuevos_actualizado_por_idx";
  DROP INDEX "equipos_usados_actualizado_por_idx";
  DROP INDEX "marcas_maquinaria_actualizado_por_idx";
  DROP INDEX "tipos_maquinaria_actualizado_por_idx";
  DROP INDEX "categorias_maquinaria_actualizado_por_idx";
  DROP INDEX "categorias_usada_actualizado_por_idx";
  DROP INDEX "marcas_lubricante_actualizado_por_idx";
  DROP INDEX "categorias_lubricante_actualizado_por_idx";
  DROP INDEX "paginas_actualizado_por_idx";
  DROP INDEX "articulos_actualizado_por_idx";
  DROP INDEX "categorias_blog_actualizado_por_idx";
  DROP INDEX "preguntas_frecuentes_actualizado_por_idx";
  DROP INDEX "testimonios_actualizado_por_idx";
  DROP INDEX "sedes_actualizado_por_idx";
  DROP INDEX "media_actualizado_por_idx";
  DROP INDEX "documentos_actualizado_por_idx";
  DROP INDEX "videos_actualizado_por_idx";
  DROP INDEX "animaciones_actualizado_por_idx";
  DROP INDEX "redirects_actualizado_por_idx";
  ALTER TABLE "modelos_repuesto" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "marcas" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "tipos_equipo" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "equipos_nuevos" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "equipos_usados" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "marcas_maquinaria" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "tipos_maquinaria" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "categorias_maquinaria" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "categorias_usada" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "marcas_lubricante" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "categorias_lubricante" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "paginas" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "articulos" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "categorias_blog" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "preguntas_frecuentes" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "testimonios" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "sedes" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "media" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "documentos" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "videos" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "animaciones" DROP COLUMN "actualizado_por_id";
  ALTER TABLE "redirects" DROP COLUMN "actualizado_por_id";`)
}
