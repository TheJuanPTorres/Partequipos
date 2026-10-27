import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_blocks_marcas_aliadas_tarjetas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar,
  	"texto" varchar,
  	"logo_id" integer,
  	"foto_id" integer,
  	"color" varchar,
  	"enlace" varchar
  );
  
  CREATE TABLE "paginas_blocks_marcas_aliadas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"titulo" varchar DEFAULT 'Marcas aliadas',
  	"imagen_fondo_id" integer,
  	"block_name" varchar
  );
  
  ALTER TABLE "paginas_blocks_marcas_aliadas_tarjetas" ADD CONSTRAINT "paginas_blocks_marcas_aliadas_tarjetas_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_marcas_aliadas_tarjetas" ADD CONSTRAINT "paginas_blocks_marcas_aliadas_tarjetas_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_marcas_aliadas_tarjetas" ADD CONSTRAINT "paginas_blocks_marcas_aliadas_tarjetas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_blocks_marcas_aliadas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_marcas_aliadas" ADD CONSTRAINT "paginas_blocks_marcas_aliadas_imagen_fondo_id_media_id_fk" FOREIGN KEY ("imagen_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_marcas_aliadas" ADD CONSTRAINT "paginas_blocks_marcas_aliadas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_marcas_aliadas_tarjetas_order_idx" ON "paginas_blocks_marcas_aliadas_tarjetas" USING btree ("_order");
  CREATE INDEX "paginas_blocks_marcas_aliadas_tarjetas_parent_id_idx" ON "paginas_blocks_marcas_aliadas_tarjetas" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_marcas_aliadas_tarjetas_logo_idx" ON "paginas_blocks_marcas_aliadas_tarjetas" USING btree ("logo_id");
  CREATE INDEX "paginas_blocks_marcas_aliadas_tarjetas_foto_idx" ON "paginas_blocks_marcas_aliadas_tarjetas" USING btree ("foto_id");
  CREATE INDEX "paginas_blocks_marcas_aliadas_order_idx" ON "paginas_blocks_marcas_aliadas" USING btree ("_order");
  CREATE INDEX "paginas_blocks_marcas_aliadas_parent_id_idx" ON "paginas_blocks_marcas_aliadas" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_marcas_aliadas_path_idx" ON "paginas_blocks_marcas_aliadas" USING btree ("_path");
  CREATE INDEX "paginas_blocks_marcas_aliadas_imagen_fondo_idx" ON "paginas_blocks_marcas_aliadas" USING btree ("imagen_fondo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "paginas_blocks_marcas_aliadas_tarjetas" CASCADE;
  DROP TABLE "paginas_blocks_marcas_aliadas" CASCADE;`)
}
