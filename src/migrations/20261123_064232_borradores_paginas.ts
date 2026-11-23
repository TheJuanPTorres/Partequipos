import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Nombres cortos de 4 campos de la portada (PR 8b): con los de antes, sus claves foráneas en
  -- la tabla de versiones pasaban de 63 bytes. RENAME: el valor se conserva.
  ALTER TABLE "paginas" RENAME COLUMN "seccion_usada_imagen_excavadoras_id" TO "seccion_usada_img_excavadoras_id";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_usada_imagen_aditamentos_id" TO "seccion_usada_img_aditamentos_id";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_repuestos_maquina_reflejo_id" TO "seccion_repuestos_reflejo_id";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_marcas_repuestos_maquina_id" TO "seccion_marcas_repuestos_foto_id";
   CREATE TYPE "public"."enum_paginas_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__paginas_hero_diap_v_tipografia_peso" AS ENUM('100', '200', '300', '400', '500', '600', '700', '800', '900');
  CREATE TYPE "public"."enum__paginas_hero_diap_v_tipografia_mayusculas" AS ENUM('mayusculas', 'normal', 'minusculas', 'palabras');
  CREATE TYPE "public"."enum__paginas_hero_diap_v_tipografia_alineacion" AS ENUM('izquierda', 'centro', 'derecha');
  CREATE TYPE "public"."enum__paginas_hero_diap_v_posicion_maquina" AS ENUM('debajo', 'sobre');
  CREATE TYPE "public"."enum__paginas_barra_botones_v_ancla" AS ENUM('nueva', 'maquinaria-usada', 'repuestos');
  CREATE TYPE "public"."enum__paginas_v_version_seccion_usada_descripcion_alineacion" AS ENUM('left', 'center', 'right', 'justify');
  CREATE TYPE "public"."enum__paginas_v_version_seccion_usada_descripcion_ancho" AS ENUM('estrecho', 'medio', 'ancho', 'columna');
  CREATE TYPE "public"."enum__paginas_v_version_seccion_usada_marcas_texto_alineacion" AS ENUM('left', 'center', 'right', 'justify');
  CREATE TYPE "public"."enum__paginas_v_version_seccion_usada_marcas_texto_ancho" AS ENUM('estrecho', 'medio', 'ancho', 'columna');
  CREATE TYPE "public"."enum__paginas_v_version_seccion_repuestos_titulo_alineacion" AS ENUM('left', 'center', 'justify');
  CREATE TYPE "public"."enum__paginas_v_version_secc_rep_desc_alineacion" AS ENUM('left', 'center', 'right', 'justify');
  CREATE TYPE "public"."enum__paginas_v_version_seccion_repuestos_descripcion_ancho" AS ENUM('estrecho', 'medio', 'ancho', 'columna');
  CREATE TYPE "public"."enum__paginas_v_version_diseno" AS ENUM('bloques', 'servicioTecnico');
  CREATE TYPE "public"."enum__paginas_v_version_tipo_pagina" AS ENUM('institucional', 'legal', 'portada');
  CREATE TYPE "public"."enum__paginas_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "_paginas_v_version_secciones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"ancla" varchar,
  	"contenido" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_cabecera_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"video_id" integer,
  	"imagen_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_blocks_pres_imagen_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"imagen_id" integer,
  	"lottie_id" integer,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" jsonb,
  	"boton_texto" varchar,
  	"boton_enlace" varchar,
  	"textura_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_cifras_cifras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefijo" varchar,
  	"numero" numeric,
  	"sufijo" varchar,
  	"etiqueta" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_cifras" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_franja_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"texto" varchar,
  	"imagen_fondo_id" integer,
  	"imagen_frontal_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_marcas_aliadas_tarjetas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar,
  	"texto" varchar,
  	"logo_id" integer,
  	"foto_id" integer,
  	"color" varchar,
  	"enlace" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_marcas_aliadas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"titulo" varchar DEFAULT 'Marcas aliadas',
  	"imagen_fondo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_blocks_tarjetas_exp_v_tarjetas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar,
  	"texto" varchar,
  	"imagen_id" integer,
  	"enlace" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_blocks_tarjetas_exp_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"boton_texto" varchar,
  	"boton_enlace" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_galeria_imagenes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"imagen_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_galeria" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_video_youtube" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" jsonb,
  	"youtube" varchar,
  	"miniatura_id" integer,
  	"descripcion_youtube" varchar,
  	"video_taller_id" integer,
  	"video_fondo_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_formulario_contacto" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"texto" varchar,
  	"boton_texto" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_proceso_pasos_pasos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"etiqueta" varchar,
  	"texto" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_proceso_pasos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"antetitulo" varchar,
  	"titulo" varchar,
  	"entradilla" varchar,
  	"boton_texto" varchar,
  	"boton_enlace" varchar,
  	"textura_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_documento_visor" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"ancla" varchar,
  	"documento_id" integer,
  	"titulo" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_hero_diap_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"mostrar_titulo" boolean DEFAULT true,
  	"mostrar_texto_circular" boolean DEFAULT true,
  	"mostrar_descripcion" boolean DEFAULT true,
  	"titulo" varchar,
  	"titulo_arriba" varchar,
  	"titulo_abajo" varchar,
  	"tipografia_fuente_id" integer,
  	"tipografia_peso" "enum__paginas_hero_diap_v_tipografia_peso",
  	"tipografia_tamano_escritorio" numeric,
  	"tipografia_tamano_tablet" numeric,
  	"tipografia_tamano_movil" numeric,
  	"tipografia_interlineado" numeric,
  	"tipografia_interletrado" numeric,
  	"tipografia_color" varchar,
  	"tipografia_mayusculas" "enum__paginas_hero_diap_v_tipografia_mayusculas",
  	"tipografia_alineacion" "enum__paginas_hero_diap_v_tipografia_alineacion",
  	"tipografia_posicion_x_escritorio" numeric,
  	"tipografia_posicion_y_escritorio" numeric,
  	"tipografia_posicion_x_tablet" numeric,
  	"tipografia_posicion_y_tablet" numeric,
  	"tipografia_posicion_x_movil" numeric,
  	"tipografia_posicion_y_movil" numeric,
  	"parrafo" varchar,
  	"imagen_fondo_id" integer,
  	"imagen_fondo_movil_id" integer,
  	"imagen_frontal_id" integer,
  	"posicion_maquina" "enum__paginas_hero_diap_v_posicion_maquina" DEFAULT 'debajo',
  	"texto_circular" varchar,
  	"enlace" varchar,
  	"enlace_nombre" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_barra_botones_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto" varchar,
  	"ancla" "enum__paginas_barra_botones_v_ancla",
  	"imagen_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_version_seccion_logos_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_id" integer,
  	"nombre" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_banda_marca" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"marca_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v_blocks_banda_logo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"imagen_id" integer,
  	"nombre" varchar,
  	"enlace" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_paginas_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_titulo" varchar,
  	"version_entradilla" varchar,
  	"version_contenido" jsonb,
  	"version_seccion_nueva_antetitulo" varchar DEFAULT 'Venta de maquinaria',
  	"version_seccion_nueva_titulo" varchar DEFAULT 'Maquinaria pesada nueva',
  	"version_seccion_nueva_boton_texto" varchar DEFAULT 'Ver todo',
  	"version_seccion_nueva_boton_enlace" varchar DEFAULT '/maquinaria-pesada/maquinaria-pesada-nueva/marcas/',
  	"version_seccion_nueva_maquina_id" integer,
  	"version_seccion_nueva_fondo_id" integer,
  	"version_seccion_nueva_fondo_tarjetas_id" integer,
  	"version_seccion_usada_imagen_id" integer,
  	"version_seccion_usada_antetitulo" varchar DEFAULT 'Venta de maquinaria',
  	"version_seccion_usada_titulo" varchar DEFAULT 'Maquinaria pesada usada',
  	"version_seccion_usada_descripcion" varchar DEFAULT 'Encuentra excavadoras, retrocargadoras, cargadores, minicargadores, motoniveladoras y más para construcción, infraestructura y movimiento de tierra en Colombia.',
  	"version_seccion_usada_descripcion_alineacion" "enum__paginas_v_version_seccion_usada_descripcion_alineacion" DEFAULT 'left',
  	"version_seccion_usada_descripcion_ancho" "enum__paginas_v_version_seccion_usada_descripcion_ancho" DEFAULT 'columna',
  	"version_seccion_usada_img_excavadoras_id" integer,
  	"version_seccion_usada_imagen_otros_id" integer,
  	"version_seccion_usada_img_aditamentos_id" integer,
  	"version_seccion_usada_pestana_excavadoras" varchar DEFAULT 'Excavadoras',
  	"version_seccion_usada_pestana_otros" varchar DEFAULT 'Otros',
  	"version_seccion_usada_pestana_aditamentos" varchar DEFAULT 'Aditamentos',
  	"version_seccion_usada_ver_producto_texto" varchar DEFAULT 'Ver más',
  	"version_seccion_usada_marcas_titulo" varchar DEFAULT 'Marcas que Respaldan Nuestro Trabajo',
  	"version_seccion_usada_marcas_texto" varchar DEFAULT 'Trabajamos con fabricantes líderes a nivel internacional para ofrecerle calidad, rendimiento y respaldo',
  	"version_seccion_usada_marcas_texto_alineacion" "enum__paginas_v_version_seccion_usada_marcas_texto_alineacion" DEFAULT 'left',
  	"version_seccion_usada_marcas_texto_ancho" "enum__paginas_v_version_seccion_usada_marcas_texto_ancho" DEFAULT 'estrecho',
  	"version_seccion_usada_boton_texto" varchar DEFAULT 'Ver todo',
  	"version_seccion_logos_titulo" varchar DEFAULT 'Marcas que mueven',
  	"version_seccion_logos_titulo_resaltado" varchar DEFAULT 'tu operación',
  	"version_seccion_logos_maquina_id" integer,
  	"version_seccion_logos_maquina_reflejo_id" integer,
  	"version_seccion_repuestos_antetitulo" varchar DEFAULT 'Venta de repuestos',
  	"version_seccion_repuestos_titulo" varchar DEFAULT 'Encuentra Maquinaria y Repuestos Rápido y Fácil',
  	"version_seccion_repuestos_titulo_resaltado" varchar DEFAULT 'Repuestos',
  	"version_seccion_repuestos_titulo_alineacion" "enum__paginas_v_version_seccion_repuestos_titulo_alineacion" DEFAULT 'center',
  	"version_seccion_repuestos_boton_texto" varchar DEFAULT 'Ver todos los repuestos',
  	"version_seccion_repuestos_boton_enlace" varchar DEFAULT '/repuestos-maquinaria-pesada-colombia/',
  	"version_seccion_repuestos_descripcion" varchar,
  	"version_seccion_repuestos_descripcion_alineacion" "enum__paginas_v_version_secc_rep_desc_alineacion" DEFAULT 'left',
  	"version_seccion_repuestos_descripcion_ancho" "enum__paginas_v_version_seccion_repuestos_descripcion_ancho" DEFAULT 'ancho',
  	"version_seccion_repuestos_tamano_maquina" numeric DEFAULT 78,
  	"version_seccion_repuestos_whatsapp_texto" varchar DEFAULT 'Encuentra la referencia que tu máquina necesita',
  	"version_seccion_repuestos_whatsapp_mensaje" varchar DEFAULT 'Hola, busco la referencia de un repuesto para mi máquina.',
  	"version_seccion_repuestos_ver_mas_texto" varchar DEFAULT 'Ver más',
  	"version_seccion_repuestos_maquina_id" integer,
  	"version_seccion_repuestos_reflejo_id" integer,
  	"version_seccion_marcas_repuestos_antetitulo" varchar DEFAULT 'Repuestos',
  	"version_seccion_marcas_repuestos_titulo" varchar DEFAULT 'Repuestos para',
  	"version_seccion_marcas_repuestos_titulo_resaltado" varchar DEFAULT 'las marcas que trabajas',
  	"version_seccion_marcas_repuestos_foto_id" integer,
  	"version_seccion_marcas_repuestos_tamano_maquina" numeric DEFAULT 100,
  	"version_seccion_compania_video_id" integer,
  	"version_seccion_compania_imagen_id" integer,
  	"version_seccion_compania_youtube" varchar,
  	"version_seccion_compania_titulo" varchar DEFAULT 'Nuestra Compañía',
  	"version_seccion_compania_texto" varchar DEFAULT 'En Partequipos somos expertos en repuestos y maquinaria pesada, con asesores en todo el país que marcan la diferencia en Colombia',
  	"version_seccion_compania_marquesina" varchar DEFAULT 'MAQUINARIA PESADA EN COLOMBIA',
  	"version_seccion_compania_marquesina_enlace" varchar DEFAULT '/nosotros/',
  	"version_seccion_catalogo_titulo" varchar DEFAULT 'Encuentra la maquinaria que tu operación necesita',
  	"version_seccion_catalogo_catalogo_texto" varchar DEFAULT 'Catálogo',
  	"version_seccion_catalogo_catalogo_enlace" varchar DEFAULT '/maquinaria-pesada/',
  	"version_seccion_catalogo_whatsapp_texto" varchar DEFAULT 'WhatsApp',
  	"version_seccion_sedes_titulo" varchar DEFAULT 'Nuestras sedes',
  	"version_seccion_testimonios_titulo" varchar DEFAULT 'La confianza de nuestros clientes habla por nosotros',
  	"version_seccion_testimonios_ver_video_texto" varchar DEFAULT 'Ver Video',
  	"version_seccion_faq_imagen_id" integer,
  	"version_seccion_faq_titulo" varchar DEFAULT 'Preguntas frecuentes',
  	"version_seccion_faq_intro" varchar DEFAULT 'Resuelve tus dudas sobre nuestros equipos, repuestos y servicios. En Partequipos estamos para ayudarte a encontrar las mejores soluciones para mantener tu maquinaria trabajando.',
  	"version_seccion_faq_boton_texto" varchar DEFAULT 'Solicita asesoría',
  	"version_seccion_faq_boton_enlace" varchar DEFAULT '/contactanos/',
  	"version_foto_cabecera_id" integer,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"version_seo_og_image_id" integer,
  	"version_diseno" "enum__paginas_v_version_diseno" DEFAULT 'bloques',
  	"version_slug" varchar,
  	"version_tipo_pagina" "enum__paginas_v_version_tipo_pagina" DEFAULT 'institucional',
  	"version_actualizado_por_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__paginas_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_paginas_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_imagen_excavadoras_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_imagen_aditamentos_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_repuestos_maquina_reflejo_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_marcas_repuestos_maquina_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_usada_seccion_usada_imagen_excavadoras_idx";
  DROP INDEX "paginas_seccion_usada_seccion_usada_imagen_aditamentos_idx";
  DROP INDEX "paginas_seccion_repuestos_seccion_repuestos_maquina_refl_idx";
  ALTER TABLE "paginas_secciones" ALTER COLUMN "titulo" DROP NOT NULL;
  ALTER TABLE "paginas_secciones" ALTER COLUMN "ancla" DROP NOT NULL;
  ALTER TABLE "paginas" ALTER COLUMN "titulo" DROP NOT NULL;
  ALTER TABLE "paginas" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "paginas" ADD COLUMN "_status" "enum_paginas_status" DEFAULT 'draft';
  -- Lo que ya existe estaba publicado: sin esto, todas las páginas pasarían a borrador.
  UPDATE "paginas" SET "_status" = 'published';
  ALTER TABLE "_paginas_v_version_secciones" ADD CONSTRAINT "_paginas_v_version_secciones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_cabecera_video" ADD CONSTRAINT "_paginas_v_blocks_cabecera_video_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_cabecera_video" ADD CONSTRAINT "_paginas_v_blocks_cabecera_video_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_cabecera_video" ADD CONSTRAINT "_paginas_v_blocks_cabecera_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_pres_imagen_v" ADD CONSTRAINT "_paginas_blocks_pres_imagen_v_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_pres_imagen_v" ADD CONSTRAINT "_paginas_blocks_pres_imagen_v_lottie_id_animaciones_id_fk" FOREIGN KEY ("lottie_id") REFERENCES "public"."animaciones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_pres_imagen_v" ADD CONSTRAINT "_paginas_blocks_pres_imagen_v_textura_id_media_id_fk" FOREIGN KEY ("textura_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_pres_imagen_v" ADD CONSTRAINT "_paginas_blocks_pres_imagen_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_cifras_cifras" ADD CONSTRAINT "_paginas_v_blocks_cifras_cifras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v_blocks_cifras"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_cifras" ADD CONSTRAINT "_paginas_v_blocks_cifras_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_franja_marquee" ADD CONSTRAINT "_paginas_v_blocks_franja_marquee_imagen_fondo_id_media_id_fk" FOREIGN KEY ("imagen_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_franja_marquee" ADD CONSTRAINT "_paginas_v_blocks_franja_marquee_imagen_frontal_id_media_id_fk" FOREIGN KEY ("imagen_frontal_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_franja_marquee" ADD CONSTRAINT "_paginas_v_blocks_franja_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas_tarjetas" ADD CONSTRAINT "_paginas_v_blocks_marcas_aliadas_tarjetas_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas_tarjetas" ADD CONSTRAINT "_paginas_v_blocks_marcas_aliadas_tarjetas_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas_tarjetas" ADD CONSTRAINT "_paginas_v_blocks_marcas_aliadas_tarjetas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v_blocks_marcas_aliadas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas" ADD CONSTRAINT "_paginas_v_blocks_marcas_aliadas_imagen_fondo_id_media_id_fk" FOREIGN KEY ("imagen_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas" ADD CONSTRAINT "_paginas_v_blocks_marcas_aliadas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_tarjetas_exp_v_tarjetas" ADD CONSTRAINT "_paginas_blocks_tarjetas_exp_v_tarjetas_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_tarjetas_exp_v_tarjetas" ADD CONSTRAINT "_paginas_blocks_tarjetas_exp_v_tarjetas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_blocks_tarjetas_exp_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_blocks_tarjetas_exp_v" ADD CONSTRAINT "_paginas_blocks_tarjetas_exp_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_galeria_imagenes" ADD CONSTRAINT "_paginas_v_blocks_galeria_imagenes_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_galeria_imagenes" ADD CONSTRAINT "_paginas_v_blocks_galeria_imagenes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v_blocks_galeria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_galeria" ADD CONSTRAINT "_paginas_v_blocks_galeria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_video_youtube" ADD CONSTRAINT "_paginas_v_blocks_video_youtube_miniatura_id_media_id_fk" FOREIGN KEY ("miniatura_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_video_youtube" ADD CONSTRAINT "_paginas_v_blocks_video_youtube_video_taller_id_videos_id_fk" FOREIGN KEY ("video_taller_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_video_youtube" ADD CONSTRAINT "_paginas_v_blocks_video_youtube_video_fondo_id_videos_id_fk" FOREIGN KEY ("video_fondo_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_video_youtube" ADD CONSTRAINT "_paginas_v_blocks_video_youtube_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_formulario_contacto" ADD CONSTRAINT "_paginas_v_blocks_formulario_contacto_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_proceso_pasos_pasos" ADD CONSTRAINT "_paginas_v_blocks_proceso_pasos_pasos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v_blocks_proceso_pasos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_proceso_pasos" ADD CONSTRAINT "_paginas_v_blocks_proceso_pasos_textura_id_media_id_fk" FOREIGN KEY ("textura_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_proceso_pasos" ADD CONSTRAINT "_paginas_v_blocks_proceso_pasos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_documento_visor" ADD CONSTRAINT "_paginas_v_blocks_documento_visor_documento_id_documentos_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_documento_visor" ADD CONSTRAINT "_paginas_v_blocks_documento_visor_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_hero_diap_v" ADD CONSTRAINT "_paginas_hero_diap_v_tipografia_fuente_id_fuentes_id_fk" FOREIGN KEY ("tipografia_fuente_id") REFERENCES "public"."fuentes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_hero_diap_v" ADD CONSTRAINT "_paginas_hero_diap_v_imagen_fondo_id_media_id_fk" FOREIGN KEY ("imagen_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_hero_diap_v" ADD CONSTRAINT "_paginas_hero_diap_v_imagen_fondo_movil_id_media_id_fk" FOREIGN KEY ("imagen_fondo_movil_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_hero_diap_v" ADD CONSTRAINT "_paginas_hero_diap_v_imagen_frontal_id_media_id_fk" FOREIGN KEY ("imagen_frontal_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_hero_diap_v" ADD CONSTRAINT "_paginas_hero_diap_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_barra_botones_v" ADD CONSTRAINT "_paginas_barra_botones_v_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_barra_botones_v" ADD CONSTRAINT "_paginas_barra_botones_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_version_seccion_logos_logos" ADD CONSTRAINT "_paginas_v_version_seccion_logos_logos_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_version_seccion_logos_logos" ADD CONSTRAINT "_paginas_v_version_seccion_logos_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_banda_marca" ADD CONSTRAINT "_paginas_v_blocks_banda_marca_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_banda_marca" ADD CONSTRAINT "_paginas_v_blocks_banda_marca_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_banda_logo" ADD CONSTRAINT "_paginas_v_blocks_banda_logo_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_blocks_banda_logo" ADD CONSTRAINT "_paginas_v_blocks_banda_logo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_parent_id_paginas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."paginas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_nueva_maquina_id_media_id_fk" FOREIGN KEY ("version_seccion_nueva_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_nueva_fondo_id_media_id_fk" FOREIGN KEY ("version_seccion_nueva_fondo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_nueva_fondo_tarjetas_id_media_id_fk" FOREIGN KEY ("version_seccion_nueva_fondo_tarjetas_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_usada_imagen_id_media_id_fk" FOREIGN KEY ("version_seccion_usada_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_usada_img_excavadoras_id_media_id_fk" FOREIGN KEY ("version_seccion_usada_img_excavadoras_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_usada_imagen_otros_id_media_id_fk" FOREIGN KEY ("version_seccion_usada_imagen_otros_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_usada_img_aditamentos_id_media_id_fk" FOREIGN KEY ("version_seccion_usada_img_aditamentos_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_logos_maquina_id_media_id_fk" FOREIGN KEY ("version_seccion_logos_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_logos_maquina_reflejo_id_media_id_fk" FOREIGN KEY ("version_seccion_logos_maquina_reflejo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_repuestos_maquina_id_media_id_fk" FOREIGN KEY ("version_seccion_repuestos_maquina_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_repuestos_reflejo_id_media_id_fk" FOREIGN KEY ("version_seccion_repuestos_reflejo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_marcas_repuestos_foto_id_media_id_fk" FOREIGN KEY ("version_seccion_marcas_repuestos_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_compania_video_id_videos_id_fk" FOREIGN KEY ("version_seccion_compania_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_compania_imagen_id_media_id_fk" FOREIGN KEY ("version_seccion_compania_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seccion_faq_imagen_id_media_id_fk" FOREIGN KEY ("version_seccion_faq_imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_foto_cabecera_id_media_id_fk" FOREIGN KEY ("version_foto_cabecera_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v" ADD CONSTRAINT "_paginas_v_version_actualizado_por_id_users_id_fk" FOREIGN KEY ("version_actualizado_por_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_paginas_v_rels" ADD CONSTRAINT "_paginas_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_paginas_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_paginas_v_rels" ADD CONSTRAINT "_paginas_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_paginas_v_version_secciones_order_idx" ON "_paginas_v_version_secciones" USING btree ("_order");
  CREATE INDEX "_paginas_v_version_secciones_parent_id_idx" ON "_paginas_v_version_secciones" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_cabecera_video_order_idx" ON "_paginas_v_blocks_cabecera_video" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_cabecera_video_parent_id_idx" ON "_paginas_v_blocks_cabecera_video" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_cabecera_video_path_idx" ON "_paginas_v_blocks_cabecera_video" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_cabecera_video_video_idx" ON "_paginas_v_blocks_cabecera_video" USING btree ("video_id");
  CREATE INDEX "_paginas_v_blocks_cabecera_video_imagen_idx" ON "_paginas_v_blocks_cabecera_video" USING btree ("imagen_id");
  CREATE INDEX "_paginas_blocks_pres_imagen_v_order_idx" ON "_paginas_blocks_pres_imagen_v" USING btree ("_order");
  CREATE INDEX "_paginas_blocks_pres_imagen_v_parent_id_idx" ON "_paginas_blocks_pres_imagen_v" USING btree ("_parent_id");
  CREATE INDEX "_paginas_blocks_pres_imagen_v_path_idx" ON "_paginas_blocks_pres_imagen_v" USING btree ("_path");
  CREATE INDEX "_paginas_blocks_pres_imagen_v_imagen_idx" ON "_paginas_blocks_pres_imagen_v" USING btree ("imagen_id");
  CREATE INDEX "_paginas_blocks_pres_imagen_v_lottie_idx" ON "_paginas_blocks_pres_imagen_v" USING btree ("lottie_id");
  CREATE INDEX "_paginas_blocks_pres_imagen_v_textura_idx" ON "_paginas_blocks_pres_imagen_v" USING btree ("textura_id");
  CREATE INDEX "_paginas_v_blocks_cifras_cifras_order_idx" ON "_paginas_v_blocks_cifras_cifras" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_cifras_cifras_parent_id_idx" ON "_paginas_v_blocks_cifras_cifras" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_cifras_order_idx" ON "_paginas_v_blocks_cifras" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_cifras_parent_id_idx" ON "_paginas_v_blocks_cifras" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_cifras_path_idx" ON "_paginas_v_blocks_cifras" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_franja_marquee_order_idx" ON "_paginas_v_blocks_franja_marquee" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_franja_marquee_parent_id_idx" ON "_paginas_v_blocks_franja_marquee" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_franja_marquee_path_idx" ON "_paginas_v_blocks_franja_marquee" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_franja_marquee_imagen_fondo_idx" ON "_paginas_v_blocks_franja_marquee" USING btree ("imagen_fondo_id");
  CREATE INDEX "_paginas_v_blocks_franja_marquee_imagen_frontal_idx" ON "_paginas_v_blocks_franja_marquee" USING btree ("imagen_frontal_id");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_tarjetas_order_idx" ON "_paginas_v_blocks_marcas_aliadas_tarjetas" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_tarjetas_parent_id_idx" ON "_paginas_v_blocks_marcas_aliadas_tarjetas" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_tarjetas_logo_idx" ON "_paginas_v_blocks_marcas_aliadas_tarjetas" USING btree ("logo_id");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_tarjetas_foto_idx" ON "_paginas_v_blocks_marcas_aliadas_tarjetas" USING btree ("foto_id");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_order_idx" ON "_paginas_v_blocks_marcas_aliadas" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_parent_id_idx" ON "_paginas_v_blocks_marcas_aliadas" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_path_idx" ON "_paginas_v_blocks_marcas_aliadas" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_marcas_aliadas_imagen_fondo_idx" ON "_paginas_v_blocks_marcas_aliadas" USING btree ("imagen_fondo_id");
  CREATE INDEX "_paginas_blocks_tarjetas_exp_v_tarjetas_order_idx" ON "_paginas_blocks_tarjetas_exp_v_tarjetas" USING btree ("_order");
  CREATE INDEX "_paginas_blocks_tarjetas_exp_v_tarjetas_parent_id_idx" ON "_paginas_blocks_tarjetas_exp_v_tarjetas" USING btree ("_parent_id");
  CREATE INDEX "_paginas_blocks_tarjetas_exp_v_tarjetas_imagen_idx" ON "_paginas_blocks_tarjetas_exp_v_tarjetas" USING btree ("imagen_id");
  CREATE INDEX "_paginas_blocks_tarjetas_exp_v_order_idx" ON "_paginas_blocks_tarjetas_exp_v" USING btree ("_order");
  CREATE INDEX "_paginas_blocks_tarjetas_exp_v_parent_id_idx" ON "_paginas_blocks_tarjetas_exp_v" USING btree ("_parent_id");
  CREATE INDEX "_paginas_blocks_tarjetas_exp_v_path_idx" ON "_paginas_blocks_tarjetas_exp_v" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_galeria_imagenes_order_idx" ON "_paginas_v_blocks_galeria_imagenes" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_galeria_imagenes_parent_id_idx" ON "_paginas_v_blocks_galeria_imagenes" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_galeria_imagenes_imagen_idx" ON "_paginas_v_blocks_galeria_imagenes" USING btree ("imagen_id");
  CREATE INDEX "_paginas_v_blocks_galeria_order_idx" ON "_paginas_v_blocks_galeria" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_galeria_parent_id_idx" ON "_paginas_v_blocks_galeria" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_galeria_path_idx" ON "_paginas_v_blocks_galeria" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_video_youtube_order_idx" ON "_paginas_v_blocks_video_youtube" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_video_youtube_parent_id_idx" ON "_paginas_v_blocks_video_youtube" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_video_youtube_path_idx" ON "_paginas_v_blocks_video_youtube" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_video_youtube_miniatura_idx" ON "_paginas_v_blocks_video_youtube" USING btree ("miniatura_id");
  CREATE INDEX "_paginas_v_blocks_video_youtube_video_taller_idx" ON "_paginas_v_blocks_video_youtube" USING btree ("video_taller_id");
  CREATE INDEX "_paginas_v_blocks_video_youtube_video_fondo_idx" ON "_paginas_v_blocks_video_youtube" USING btree ("video_fondo_id");
  CREATE INDEX "_paginas_v_blocks_formulario_contacto_order_idx" ON "_paginas_v_blocks_formulario_contacto" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_formulario_contacto_parent_id_idx" ON "_paginas_v_blocks_formulario_contacto" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_formulario_contacto_path_idx" ON "_paginas_v_blocks_formulario_contacto" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_proceso_pasos_pasos_order_idx" ON "_paginas_v_blocks_proceso_pasos_pasos" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_proceso_pasos_pasos_parent_id_idx" ON "_paginas_v_blocks_proceso_pasos_pasos" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_proceso_pasos_order_idx" ON "_paginas_v_blocks_proceso_pasos" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_proceso_pasos_parent_id_idx" ON "_paginas_v_blocks_proceso_pasos" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_proceso_pasos_path_idx" ON "_paginas_v_blocks_proceso_pasos" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_proceso_pasos_textura_idx" ON "_paginas_v_blocks_proceso_pasos" USING btree ("textura_id");
  CREATE INDEX "_paginas_v_blocks_documento_visor_order_idx" ON "_paginas_v_blocks_documento_visor" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_documento_visor_parent_id_idx" ON "_paginas_v_blocks_documento_visor" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_documento_visor_path_idx" ON "_paginas_v_blocks_documento_visor" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_documento_visor_documento_idx" ON "_paginas_v_blocks_documento_visor" USING btree ("documento_id");
  CREATE INDEX "_paginas_hero_diap_v_order_idx" ON "_paginas_hero_diap_v" USING btree ("_order");
  CREATE INDEX "_paginas_hero_diap_v_parent_id_idx" ON "_paginas_hero_diap_v" USING btree ("_parent_id");
  CREATE INDEX "_paginas_hero_diap_v_tipografia_tipografia_fuente_idx" ON "_paginas_hero_diap_v" USING btree ("tipografia_fuente_id");
  CREATE INDEX "_paginas_hero_diap_v_imagen_fondo_idx" ON "_paginas_hero_diap_v" USING btree ("imagen_fondo_id");
  CREATE INDEX "_paginas_hero_diap_v_imagen_fondo_movil_idx" ON "_paginas_hero_diap_v" USING btree ("imagen_fondo_movil_id");
  CREATE INDEX "_paginas_hero_diap_v_imagen_frontal_idx" ON "_paginas_hero_diap_v" USING btree ("imagen_frontal_id");
  CREATE INDEX "_paginas_barra_botones_v_order_idx" ON "_paginas_barra_botones_v" USING btree ("_order");
  CREATE INDEX "_paginas_barra_botones_v_parent_id_idx" ON "_paginas_barra_botones_v" USING btree ("_parent_id");
  CREATE INDEX "_paginas_barra_botones_v_imagen_idx" ON "_paginas_barra_botones_v" USING btree ("imagen_id");
  CREATE INDEX "_paginas_v_version_seccion_logos_logos_order_idx" ON "_paginas_v_version_seccion_logos_logos" USING btree ("_order");
  CREATE INDEX "_paginas_v_version_seccion_logos_logos_parent_id_idx" ON "_paginas_v_version_seccion_logos_logos" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_version_seccion_logos_logos_logo_idx" ON "_paginas_v_version_seccion_logos_logos" USING btree ("logo_id");
  CREATE INDEX "_paginas_v_blocks_banda_marca_order_idx" ON "_paginas_v_blocks_banda_marca" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_banda_marca_parent_id_idx" ON "_paginas_v_blocks_banda_marca" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_banda_marca_path_idx" ON "_paginas_v_blocks_banda_marca" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_banda_marca_marca_idx" ON "_paginas_v_blocks_banda_marca" USING btree ("marca_id");
  CREATE INDEX "_paginas_v_blocks_banda_logo_order_idx" ON "_paginas_v_blocks_banda_logo" USING btree ("_order");
  CREATE INDEX "_paginas_v_blocks_banda_logo_parent_id_idx" ON "_paginas_v_blocks_banda_logo" USING btree ("_parent_id");
  CREATE INDEX "_paginas_v_blocks_banda_logo_path_idx" ON "_paginas_v_blocks_banda_logo" USING btree ("_path");
  CREATE INDEX "_paginas_v_blocks_banda_logo_imagen_idx" ON "_paginas_v_blocks_banda_logo" USING btree ("imagen_id");
  CREATE INDEX "_paginas_v_parent_idx" ON "_paginas_v" USING btree ("parent_id");
  CREATE INDEX "_paginas_v_version_seccion_nueva_version_seccion_nueva_m_idx" ON "_paginas_v" USING btree ("version_seccion_nueva_maquina_id");
  CREATE INDEX "_paginas_v_version_seccion_nueva_version_seccion_nueva_f_idx" ON "_paginas_v" USING btree ("version_seccion_nueva_fondo_id");
  CREATE INDEX "_paginas_v_version_seccion_nueva_version_seccion_nueva_1_idx" ON "_paginas_v" USING btree ("version_seccion_nueva_fondo_tarjetas_id");
  CREATE INDEX "_paginas_v_version_seccion_usada_version_seccion_usada_i_idx" ON "_paginas_v" USING btree ("version_seccion_usada_imagen_id");
  CREATE INDEX "_paginas_v_version_seccion_usada_version_seccion_usada_1_idx" ON "_paginas_v" USING btree ("version_seccion_usada_img_excavadoras_id");
  CREATE INDEX "_paginas_v_version_seccion_usada_version_seccion_usada_2_idx" ON "_paginas_v" USING btree ("version_seccion_usada_imagen_otros_id");
  CREATE INDEX "_paginas_v_version_seccion_usada_version_seccion_usada_3_idx" ON "_paginas_v" USING btree ("version_seccion_usada_img_aditamentos_id");
  CREATE INDEX "_paginas_v_version_seccion_logos_version_seccion_logos_m_idx" ON "_paginas_v" USING btree ("version_seccion_logos_maquina_id");
  CREATE INDEX "_paginas_v_version_seccion_logos_version_seccion_logos_1_idx" ON "_paginas_v" USING btree ("version_seccion_logos_maquina_reflejo_id");
  CREATE INDEX "_paginas_v_version_seccion_repuestos_version_seccion_rep_idx" ON "_paginas_v" USING btree ("version_seccion_repuestos_maquina_id");
  CREATE INDEX "_paginas_v_version_seccion_repuestos_version_seccion_r_1_idx" ON "_paginas_v" USING btree ("version_seccion_repuestos_reflejo_id");
  CREATE INDEX "_paginas_v_version_seccion_marcas_repuestos_version_secc_idx" ON "_paginas_v" USING btree ("version_seccion_marcas_repuestos_foto_id");
  CREATE INDEX "_paginas_v_version_seccion_compania_version_seccion_comp_idx" ON "_paginas_v" USING btree ("version_seccion_compania_video_id");
  CREATE INDEX "_paginas_v_version_seccion_compania_version_seccion_co_1_idx" ON "_paginas_v" USING btree ("version_seccion_compania_imagen_id");
  CREATE INDEX "_paginas_v_version_seccion_faq_version_seccion_faq_image_idx" ON "_paginas_v" USING btree ("version_seccion_faq_imagen_id");
  CREATE INDEX "_paginas_v_version_version_foto_cabecera_idx" ON "_paginas_v" USING btree ("version_foto_cabecera_id");
  CREATE INDEX "_paginas_v_version_seo_version_seo_og_image_idx" ON "_paginas_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX "_paginas_v_version_version_slug_idx" ON "_paginas_v" USING btree ("version_slug");
  CREATE INDEX "_paginas_v_version_version_actualizado_por_idx" ON "_paginas_v" USING btree ("version_actualizado_por_id");
  CREATE INDEX "_paginas_v_version_version_updated_at_idx" ON "_paginas_v" USING btree ("version_updated_at");
  CREATE INDEX "_paginas_v_version_version_created_at_idx" ON "_paginas_v" USING btree ("version_created_at");
  CREATE INDEX "_paginas_v_version_version__status_idx" ON "_paginas_v" USING btree ("version__status");
  CREATE INDEX "_paginas_v_created_at_idx" ON "_paginas_v" USING btree ("created_at");
  CREATE INDEX "_paginas_v_updated_at_idx" ON "_paginas_v" USING btree ("updated_at");
  CREATE INDEX "_paginas_v_latest_idx" ON "_paginas_v" USING btree ("latest");
  CREATE INDEX "_paginas_v_rels_order_idx" ON "_paginas_v_rels" USING btree ("order");
  CREATE INDEX "_paginas_v_rels_parent_idx" ON "_paginas_v_rels" USING btree ("parent_id");
  CREATE INDEX "_paginas_v_rels_path_idx" ON "_paginas_v_rels" USING btree ("path");
  CREATE INDEX "_paginas_v_rels_media_id_idx" ON "_paginas_v_rels" USING btree ("media_id");
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_img_excavadoras_id_media_id_fk" FOREIGN KEY ("seccion_usada_img_excavadoras_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_img_aditamentos_id_media_id_fk" FOREIGN KEY ("seccion_usada_img_aditamentos_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_repuestos_reflejo_id_media_id_fk" FOREIGN KEY ("seccion_repuestos_reflejo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_marcas_repuestos_foto_id_media_id_fk" FOREIGN KEY ("seccion_marcas_repuestos_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_usada_seccion_usada_img_excavadoras_idx" ON "paginas" USING btree ("seccion_usada_img_excavadoras_id");
  CREATE INDEX "paginas_seccion_usada_seccion_usada_img_aditamentos_idx" ON "paginas" USING btree ("seccion_usada_img_aditamentos_id");
  CREATE INDEX "paginas_seccion_repuestos_seccion_repuestos_reflejo_idx" ON "paginas" USING btree ("seccion_repuestos_reflejo_id");
  CREATE INDEX "paginas__status_idx" ON "paginas" USING btree ("_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_paginas_v_version_secciones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_cabecera_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_blocks_pres_imagen_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_cifras_cifras" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_cifras" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_franja_marquee" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas_tarjetas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_marcas_aliadas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_blocks_tarjetas_exp_v_tarjetas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_blocks_tarjetas_exp_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_galeria_imagenes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_galeria" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_video_youtube" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_formulario_contacto" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_proceso_pasos_pasos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_proceso_pasos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_documento_visor" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_hero_diap_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_barra_botones_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_version_seccion_logos_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_banda_marca" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_blocks_banda_logo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_paginas_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_paginas_v_version_secciones" CASCADE;
  DROP TABLE "_paginas_v_blocks_cabecera_video" CASCADE;
  DROP TABLE "_paginas_blocks_pres_imagen_v" CASCADE;
  DROP TABLE "_paginas_v_blocks_cifras_cifras" CASCADE;
  DROP TABLE "_paginas_v_blocks_cifras" CASCADE;
  DROP TABLE "_paginas_v_blocks_franja_marquee" CASCADE;
  DROP TABLE "_paginas_v_blocks_marcas_aliadas_tarjetas" CASCADE;
  DROP TABLE "_paginas_v_blocks_marcas_aliadas" CASCADE;
  DROP TABLE "_paginas_blocks_tarjetas_exp_v_tarjetas" CASCADE;
  DROP TABLE "_paginas_blocks_tarjetas_exp_v" CASCADE;
  DROP TABLE "_paginas_v_blocks_galeria_imagenes" CASCADE;
  DROP TABLE "_paginas_v_blocks_galeria" CASCADE;
  DROP TABLE "_paginas_v_blocks_video_youtube" CASCADE;
  DROP TABLE "_paginas_v_blocks_formulario_contacto" CASCADE;
  DROP TABLE "_paginas_v_blocks_proceso_pasos_pasos" CASCADE;
  DROP TABLE "_paginas_v_blocks_proceso_pasos" CASCADE;
  DROP TABLE "_paginas_v_blocks_documento_visor" CASCADE;
  DROP TABLE "_paginas_hero_diap_v" CASCADE;
  DROP TABLE "_paginas_barra_botones_v" CASCADE;
  DROP TABLE "_paginas_v_version_seccion_logos_logos" CASCADE;
  DROP TABLE "_paginas_v_blocks_banda_marca" CASCADE;
  DROP TABLE "_paginas_v_blocks_banda_logo" CASCADE;
  DROP TABLE "_paginas_v" CASCADE;
  DROP TABLE "_paginas_v_rels" CASCADE;
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_img_excavadoras_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_usada_img_aditamentos_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_repuestos_reflejo_id_media_id_fk";
  
  ALTER TABLE "paginas" DROP CONSTRAINT "paginas_seccion_marcas_repuestos_foto_id_media_id_fk";
  
  DROP INDEX "paginas_seccion_usada_seccion_usada_img_excavadoras_idx";
  DROP INDEX "paginas_seccion_usada_seccion_usada_img_aditamentos_idx";
  DROP INDEX "paginas_seccion_repuestos_seccion_repuestos_reflejo_idx";
  DROP INDEX "paginas__status_idx";
  ALTER TABLE "paginas_secciones" ALTER COLUMN "titulo" SET NOT NULL;
  ALTER TABLE "paginas_secciones" ALTER COLUMN "ancla" SET NOT NULL;
  ALTER TABLE "paginas" ALTER COLUMN "titulo" SET NOT NULL;
  ALTER TABLE "paginas" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_imagen_excavadoras_id_media_id_fk" FOREIGN KEY ("seccion_usada_img_excavadoras_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_usada_imagen_aditamentos_id_media_id_fk" FOREIGN KEY ("seccion_usada_img_aditamentos_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_repuestos_maquina_reflejo_id_media_id_fk" FOREIGN KEY ("seccion_repuestos_reflejo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seccion_marcas_repuestos_maquina_id_media_id_fk" FOREIGN KEY ("seccion_marcas_repuestos_foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "paginas_seccion_usada_seccion_usada_imagen_excavadoras_idx" ON "paginas" USING btree ("seccion_usada_img_excavadoras_id");
  CREATE INDEX "paginas_seccion_usada_seccion_usada_imagen_aditamentos_idx" ON "paginas" USING btree ("seccion_usada_img_aditamentos_id");
  CREATE INDEX "paginas_seccion_repuestos_seccion_repuestos_maquina_refl_idx" ON "paginas" USING btree ("seccion_repuestos_reflejo_id");
  ALTER TABLE "paginas" DROP COLUMN "_status";
  DROP TYPE "public"."enum_paginas_status";
  DROP TYPE "public"."enum__paginas_hero_diap_v_tipografia_peso";
  DROP TYPE "public"."enum__paginas_hero_diap_v_tipografia_mayusculas";
  DROP TYPE "public"."enum__paginas_hero_diap_v_tipografia_alineacion";
  DROP TYPE "public"."enum__paginas_hero_diap_v_posicion_maquina";
  DROP TYPE "public"."enum__paginas_barra_botones_v_ancla";
  DROP TYPE "public"."enum__paginas_v_version_seccion_usada_descripcion_alineacion";
  DROP TYPE "public"."enum__paginas_v_version_seccion_usada_descripcion_ancho";
  DROP TYPE "public"."enum__paginas_v_version_seccion_usada_marcas_texto_alineacion";
  DROP TYPE "public"."enum__paginas_v_version_seccion_usada_marcas_texto_ancho";
  DROP TYPE "public"."enum__paginas_v_version_seccion_repuestos_titulo_alineacion";
  DROP TYPE "public"."enum__paginas_v_version_secc_rep_desc_alineacion";
  DROP TYPE "public"."enum__paginas_v_version_seccion_repuestos_descripcion_ancho";
  DROP TYPE "public"."enum__paginas_v_version_diseno";
  DROP TYPE "public"."enum__paginas_v_version_tipo_pagina";
  DROP TYPE "public"."enum__paginas_v_version_status";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_usada_img_excavadoras_id" TO "seccion_usada_imagen_excavadoras_id";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_usada_img_aditamentos_id" TO "seccion_usada_imagen_aditamentos_id";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_repuestos_reflejo_id" TO "seccion_repuestos_maquina_reflejo_id";
  ALTER TABLE "paginas" RENAME COLUMN "seccion_marcas_repuestos_foto_id" TO "seccion_marcas_repuestos_maquina_id";`)
}
