import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" ADD COLUMN "icono_marca_id" integer;
  ALTER TABLE "categorias_tecnicas" ADD CONSTRAINT "categorias_tecnicas_icono_marca_id_media_id_fk" FOREIGN KEY ("icono_marca_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "categorias_tecnicas_icono_marca_idx" ON "categorias_tecnicas" USING btree ("icono_marca_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categorias_tecnicas" DROP CONSTRAINT "categorias_tecnicas_icono_marca_id_media_id_fk";
  
  DROP INDEX "categorias_tecnicas_icono_marca_idx";
  ALTER TABLE "categorias_tecnicas" DROP COLUMN "icono_marca_id";`)
}
