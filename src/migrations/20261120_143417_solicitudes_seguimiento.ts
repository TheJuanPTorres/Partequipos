import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DATA TYPE text;
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DEFAULT 'nueva'::text;
  -- «Atendida» (la única salida que había) pasa a «Cerrada»: ya estaba resuelta.
  UPDATE "solicitudes" SET "estado" = 'cerrada' WHERE "estado" = 'atendida';
  DROP TYPE "public"."enum_solicitudes_estado";
  CREATE TYPE "public"."enum_solicitudes_estado" AS ENUM('nueva', 'contactada', 'cerrada');
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DEFAULT 'nueva'::"public"."enum_solicitudes_estado";
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DATA TYPE "public"."enum_solicitudes_estado" USING "estado"::"public"."enum_solicitudes_estado";
  ALTER TABLE "solicitudes" ADD COLUMN "responsable_id" integer;
  ALTER TABLE "solicitudes" ADD COLUMN "fecha_contacto" timestamp(3) with time zone;
  ALTER TABLE "solicitudes" ADD COLUMN "notas_internas" varchar;
  ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_responsable_id_users_id_fk" FOREIGN KEY ("responsable_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "solicitudes_responsable_idx" ON "solicitudes" USING btree ("responsable_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "solicitudes" DROP CONSTRAINT "solicitudes_responsable_id_users_id_fk";
  
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DATA TYPE text;
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DEFAULT 'nueva'::text;
  UPDATE "solicitudes" SET "estado" = 'atendida' WHERE "estado" IN ('contactada', 'cerrada');
  DROP TYPE "public"."enum_solicitudes_estado";
  CREATE TYPE "public"."enum_solicitudes_estado" AS ENUM('nueva', 'atendida');
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DEFAULT 'nueva'::"public"."enum_solicitudes_estado";
  ALTER TABLE "solicitudes" ALTER COLUMN "estado" SET DATA TYPE "public"."enum_solicitudes_estado" USING "estado"::"public"."enum_solicitudes_estado";
  DROP INDEX "solicitudes_responsable_idx";
  ALTER TABLE "solicitudes" DROP COLUMN "responsable_id";
  ALTER TABLE "solicitudes" DROP COLUMN "fecha_contacto";
  ALTER TABLE "solicitudes" DROP COLUMN "notas_internas";`)
}
