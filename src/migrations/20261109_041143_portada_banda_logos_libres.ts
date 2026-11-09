import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "paginas_blocks_banda_marca" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"marca_id" integer,
  	"block_name" varchar
  );

  CREATE TABLE "paginas_blocks_banda_logo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_id" integer,
  	"nombre" varchar,
  	"enlace" varchar,
  	"block_name" varchar
  );

  ALTER TABLE "paginas_rels" DROP CONSTRAINT "paginas_rels_marcas_fk";

  DROP INDEX "paginas_rels_marcas_id_idx";
  ALTER TABLE "paginas_blocks_banda_marca" ADD CONSTRAINT "paginas_blocks_banda_marca_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_banda_marca" ADD CONSTRAINT "paginas_blocks_banda_marca_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paginas_blocks_banda_logo" ADD CONSTRAINT "paginas_blocks_banda_logo_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paginas_blocks_banda_logo" ADD CONSTRAINT "paginas_blocks_banda_logo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."paginas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_blocks_banda_marca_order_idx" ON "paginas_blocks_banda_marca" USING btree ("_order");
  CREATE INDEX "paginas_blocks_banda_marca_parent_id_idx" ON "paginas_blocks_banda_marca" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_banda_marca_path_idx" ON "paginas_blocks_banda_marca" USING btree ("_path");
  CREATE INDEX "paginas_blocks_banda_marca_marca_idx" ON "paginas_blocks_banda_marca" USING btree ("marca_id");
  CREATE INDEX "paginas_blocks_banda_logo_order_idx" ON "paginas_blocks_banda_logo" USING btree ("_order");
  CREATE INDEX "paginas_blocks_banda_logo_parent_id_idx" ON "paginas_blocks_banda_logo" USING btree ("_parent_id");
  CREATE INDEX "paginas_blocks_banda_logo_path_idx" ON "paginas_blocks_banda_logo" USING btree ("_path");
  CREATE INDEX "paginas_blocks_banda_logo_imagen_idx" ON "paginas_blocks_banda_logo" USING btree ("imagen_id");`)

  // LO YA ELEGIDO SE CONSERVA (SQL explícito, CLAUDE.md §3.5): las marcas de «Marcas de la banda»
  // (relación del #429, en "paginas_rels" con la ruta 'seccionMarcasRepuestos.marcasBanda')
  // pasan, en su orden, a filas «Marca de repuestos» del campo de bloques. El id de cada fila,
  // 24 hexadecimales como los que pone Payload.
  await db.execute(sql`
  INSERT INTO "paginas_blocks_banda_marca" ("_order", "_parent_id", "_path", "id", "marca_id")
  SELECT r."order", r."parent_id", 'seccionMarcasRepuestos.marcasBanda',
         substr(md5(random()::text || clock_timestamp()::text || r."id"::text), 1, 24),
         r."marcas_id"
    FROM "paginas_rels" r
   WHERE r."path" = 'seccionMarcasRepuestos.marcasBanda' AND r."marcas_id" IS NOT NULL;
  DELETE FROM "paginas_rels" WHERE "path" = 'seccionMarcasRepuestos.marcasBanda';`)

  await db.execute(sql`
  ALTER TABLE "paginas_rels" DROP COLUMN "marcas_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "paginas_rels" ADD COLUMN "marcas_id" integer;
  ALTER TABLE "paginas_rels" ADD CONSTRAINT "paginas_rels_marcas_fk" FOREIGN KEY ("marcas_id") REFERENCES "public"."marcas"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "paginas_rels_marcas_id_idx" ON "paginas_rels" USING btree ("marcas_id");`)

  // Las filas «Marca de repuestos» vuelven a la relación, en su orden. Los LOGOS LIBRES no tienen
  // dónde volver: se pierden con su tabla (las imágenes siguen en «Imágenes»).
  await db.execute(sql`
  INSERT INTO "paginas_rels" ("order", "parent_id", "path", "marcas_id")
  SELECT b."_order", b."_parent_id", 'seccionMarcasRepuestos.marcasBanda', b."marca_id"
    FROM "paginas_blocks_banda_marca" b
   WHERE b."_path" = 'seccionMarcasRepuestos.marcasBanda' AND b."marca_id" IS NOT NULL;`)

  await db.execute(sql`
  ALTER TABLE "paginas_blocks_banda_marca" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "paginas_blocks_banda_logo" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "paginas_blocks_banda_marca" CASCADE;
  DROP TABLE "paginas_blocks_banda_logo" CASCADE;`)
}
