import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sedes_tipo" AS ENUM('principal', 'secundaria');
  ALTER TABLE "sedes" ADD COLUMN "tipo" "enum_sedes_tipo" DEFAULT 'secundaria';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sedes" DROP COLUMN "tipo";
  DROP TYPE "public"."enum_sedes_tipo";`)
}
