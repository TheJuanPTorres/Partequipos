import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_seo_horario_dias" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  CREATE TABLE "seo_horario_dias" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_seo_horario_dias",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "seo_horario" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"abre" varchar NOT NULL,
  	"cierra" varchar NOT NULL
  );
  
  CREATE TABLE "seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "seo_horario_dias" ADD CONSTRAINT "seo_horario_dias_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."seo_horario"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_horario" ADD CONSTRAINT "seo_horario_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "seo_horario_dias_order_idx" ON "seo_horario_dias" USING btree ("order");
  CREATE INDEX "seo_horario_dias_parent_idx" ON "seo_horario_dias" USING btree ("parent_id");
  CREATE INDEX "seo_horario_order_idx" ON "seo_horario" USING btree ("_order");
  CREATE INDEX "seo_horario_parent_id_idx" ON "seo_horario" USING btree ("_parent_id");`)

  /*
   * SIEMBRA (CLAUDE.md §3.5: SQL explícito, nunca la API local). El horario
   * que antes estaba escrito en `seoConfig.contact.openingHours`: lunes a
   * viernes de 08:00 a 17:30 y sábado de 09:00 a 12:00.
   */
  await db.execute(sql`
  INSERT INTO "seo" ("id", "updated_at", "created_at") VALUES (1, now(), now());

  INSERT INTO "seo_horario" ("_order", "_parent_id", "id", "abre", "cierra") VALUES
    (1, 1, '6ad0f1e2a5ec44005ea5b001', '08:00', '17:30'),
    (2, 1, '6ad0f1e2a5ec44005ea5b002', '09:00', '12:00');

  INSERT INTO "seo_horario_dias" ("order", "parent_id", "value") VALUES
    (1, '6ad0f1e2a5ec44005ea5b001', 'Monday'),
    (2, '6ad0f1e2a5ec44005ea5b001', 'Tuesday'),
    (3, '6ad0f1e2a5ec44005ea5b001', 'Wednesday'),
    (4, '6ad0f1e2a5ec44005ea5b001', 'Thursday'),
    (5, '6ad0f1e2a5ec44005ea5b001', 'Friday'),
    (1, '6ad0f1e2a5ec44005ea5b002', 'Saturday');

  SELECT setval(pg_get_serial_sequence('"seo"', 'id'), 1);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "seo_horario_dias" CASCADE;
  DROP TABLE "seo_horario" CASCADE;
  DROP TABLE "seo" CASCADE;
  DROP TYPE "public"."enum_seo_horario_dias";`)
}
