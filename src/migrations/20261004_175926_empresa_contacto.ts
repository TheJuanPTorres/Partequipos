import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "seo_empresa_redes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "seo" ADD COLUMN "empresa_telefono" varchar;
  ALTER TABLE "seo" ADD COLUMN "empresa_whatsapp" varchar;
  ALTER TABLE "seo" ADD COLUMN "empresa_correo" varchar;
  ALTER TABLE "seo" ADD COLUMN "empresa_direccion" varchar;
  ALTER TABLE "seo" ADD COLUMN "empresa_ciudad" varchar;
  ALTER TABLE "seo_empresa_redes" ADD CONSTRAINT "seo_empresa_redes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "seo_empresa_redes_order_idx" ON "seo_empresa_redes" USING btree ("_order");
  CREATE INDEX "seo_empresa_redes_parent_id_idx" ON "seo_empresa_redes" USING btree ("_parent_id");`)

  /*
   * SIEMBRA (CLAUDE.md §3.5: SQL explícito, nunca la API local). Los mismos
   * valores que hoy tiene el respaldo `seoConfig.contact` y `seoConfig.sameAs`
   * de src/lib/seo/config.ts, para que el sitio se vea exactamente igual. El
   * WhatsApp se siembra igual que el teléfono, como lo usaba el sitio.
   *
   * El global `seo` tiene una sola fila, que creó la migración del horario
   * (20261002_010203_seo_horario, id 1). Se toca solo si existe: sin fila no
   * hay nada que sembrar y el sitio usa el respaldo.
   */
  await db.execute(sql`
  UPDATE "seo" SET
    "empresa_telefono" = '+57 317 670 7071',
    "empresa_whatsapp" = '+57 317 670 7071',
    "empresa_correo" = 'info@partequipos.com',
    "empresa_direccion" = 'Carrera 68D # 17A-84',
    "empresa_ciudad" = 'Bogotá D.C.'
  WHERE "id" = 1;

  INSERT INTO "seo_empresa_redes" ("_order", "_parent_id", "id", "url")
  SELECT v."orden", 1, v."id", v."url"
  FROM (VALUES
    (1, '6ad1e7c0a5ec44005ea5c001', 'https://www.facebook.com/partequip0s'),
    (2, '6ad1e7c0a5ec44005ea5c002', 'https://www.instagram.com/partequipos_sas/'),
    (3, '6ad1e7c0a5ec44005ea5c003', 'https://www.youtube.com/channel/UCiUU1dE8QvchvTKv47KuDVw')
  ) AS v("orden", "id", "url")
  WHERE EXISTS (SELECT 1 FROM "seo" WHERE "id" = 1);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "seo_empresa_redes" CASCADE;
  ALTER TABLE "seo" DROP COLUMN "empresa_telefono";
  ALTER TABLE "seo" DROP COLUMN "empresa_whatsapp";
  ALTER TABLE "seo" DROP COLUMN "empresa_correo";
  ALTER TABLE "seo" DROP COLUMN "empresa_direccion";
  ALTER TABLE "seo" DROP COLUMN "empresa_ciudad";`)
}
