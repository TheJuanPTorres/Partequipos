import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_blocks_cabecera_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"video_id" integer,
  	"imagen_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "paginas_blocks_presentacion_imagen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_id" integer,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" jsonb,
  	"boton_texto" varchar,
  	"boton_enlace" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "paginas_blocks_cifras_cifras" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"prefijo" varchar,
  	"numero" numeric,
  	"sufijo" varchar,
  	"etiqueta" varchar
  );
  
  CREATE TABLE "paginas_blocks_cifras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "paginas_blocks_franja_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texto" varchar,
  	"imagen_fondo_id" integer,
  	"imagen_frontal_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "paginas_blocks_tarjetas_exp_tarjetas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"texto" varchar,
  	"imagen_id" integer,
  	"enlace" varchar
  );
  
  CREATE TABLE "paginas_blocks_tarjetas_exp" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"boton_texto" varchar,
  	"boton_enlace" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "paginas_blocks_cabecera_video" ADD CONSTRAINT "paginas_blocks_cabecera_video_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_cabecera_video" ADD CONSTRAINT "paginas_blocks_cabecera_video_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_cabecera_video" ADD CONSTRAINT "paginas_blocks_cabecera_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD CONSTRAINT "paginas_blocks_presentacion_imagen_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_presentacion_imagen" ADD CONSTRAINT "paginas_blocks_presentacion_imagen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_cifras_cifras" ADD CONSTRAINT "paginas_blocks_cifras_cifras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_blocks_cifras"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_cifras" ADD CONSTRAINT "paginas_blocks_cifras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_franja_marquee" ADD CONSTRAINT "paginas_blocks_franja_marquee_imagen_fondo_id_media_id_fk" FOREIGN KEY ("imagen_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_franja_marquee" ADD CONSTRAINT "paginas_blocks_franja_marquee_imagen_frontal_id_media_id_fk" FOREIGN KEY ("imagen_frontal_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_franja_marquee" ADD CONSTRAINT "paginas_blocks_franja_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_tarjetas_exp_tarjetas" ADD CONSTRAINT "paginas_blocks_tarjetas_exp_tarjetas_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_tarjetas_exp_tarjetas" ADD CONSTRAINT "paginas_blocks_tarjetas_exp_tarjetas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas_blocks_tarjetas_exp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_tarjetas_exp" ADD CONSTRAINT "paginas_blocks_tarjetas_exp_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_cabecera_video_order_idx" ON "paginas_blocks_cabecera_video" USING btree ("_order");
  CREATE INDEX "paginas_blocks_cabecera_video_parent_id_idx" ON "paginas_blocks_cabecera_video" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_cabecera_video_path_idx" ON "paginas_blocks_cabecera_video" USING btree ("_path");
  CREATE INDEX "paginas_blocks_cabecera_video_video_idx" ON "paginas_blocks_cabecera_video" USING btree ("video_id");
  CREATE INDEX "paginas_blocks_cabecera_video_imagen_idx" ON "paginas_blocks_cabecera_video" USING btree ("imagen_id");
  CREATE INDEX "paginas_blocks_presentacion_imagen_order_idx" ON "paginas_blocks_presentacion_imagen" USING btree ("_order");
  CREATE INDEX "paginas_blocks_presentacion_imagen_parent_id_idx" ON "paginas_blocks_presentacion_imagen" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_presentacion_imagen_path_idx" ON "paginas_blocks_presentacion_imagen" USING btree ("_path");
  CREATE INDEX "paginas_blocks_presentacion_imagen_imagen_idx" ON "paginas_blocks_presentacion_imagen" USING btree ("imagen_id");
  CREATE INDEX "paginas_blocks_cifras_cifras_order_idx" ON "paginas_blocks_cifras_cifras" USING btree ("_order");
  CREATE INDEX "paginas_blocks_cifras_cifras_parent_id_idx" ON "paginas_blocks_cifras_cifras" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_cifras_order_idx" ON "paginas_blocks_cifras" USING btree ("_order");
  CREATE INDEX "paginas_blocks_cifras_parent_id_idx" ON "paginas_blocks_cifras" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_cifras_path_idx" ON "paginas_blocks_cifras" USING btree ("_path");
  CREATE INDEX "paginas_blocks_franja_marquee_order_idx" ON "paginas_blocks_franja_marquee" USING btree ("_order");
  CREATE INDEX "paginas_blocks_franja_marquee_parent_id_idx" ON "paginas_blocks_franja_marquee" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_franja_marquee_path_idx" ON "paginas_blocks_franja_marquee" USING btree ("_path");
  CREATE INDEX "paginas_blocks_franja_marquee_imagen_fondo_idx" ON "paginas_blocks_franja_marquee" USING btree ("imagen_fondo_id");
  CREATE INDEX "paginas_blocks_franja_marquee_imagen_frontal_idx" ON "paginas_blocks_franja_marquee" USING btree ("imagen_frontal_id");
  CREATE INDEX "paginas_blocks_tarjetas_exp_tarjetas_order_idx" ON "paginas_blocks_tarjetas_exp_tarjetas" USING btree ("_order");
  CREATE INDEX "paginas_blocks_tarjetas_exp_tarjetas_parent_id_idx" ON "paginas_blocks_tarjetas_exp_tarjetas" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_tarjetas_exp_tarjetas_imagen_idx" ON "paginas_blocks_tarjetas_exp_tarjetas" USING btree ("imagen_id");
  CREATE INDEX "paginas_blocks_tarjetas_exp_order_idx" ON "paginas_blocks_tarjetas_exp" USING btree ("_order");
  CREATE INDEX "paginas_blocks_tarjetas_exp_parent_id_idx" ON "paginas_blocks_tarjetas_exp" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_tarjetas_exp_path_idx" ON "paginas_blocks_tarjetas_exp" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "paginas_blocks_cabecera_video" CASCADE;
  DROP TABLE "paginas_blocks_presentacion_imagen" CASCADE;
  DROP TABLE "paginas_blocks_cifras_cifras" CASCADE;
  DROP TABLE "paginas_blocks_cifras" CASCADE;
  DROP TABLE "paginas_blocks_franja_marquee" CASCADE;
  DROP TABLE "paginas_blocks_tarjetas_exp_tarjetas" CASCADE;
  DROP TABLE "paginas_blocks_tarjetas_exp" CASCADE;`)
}
