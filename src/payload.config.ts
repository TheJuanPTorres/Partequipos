import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { CategoriaTecnica } from "./collections/CategoriaTecnica";
import { Marca } from "./collections/Marca";
import { Media } from "./collections/Media";
import { ModeloRepuesto } from "./collections/ModeloRepuesto";
import { Redirects } from "./collections/Redirects";
import { TipoEquipo } from "./collections/TipoEquipo";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Marca, TipoEquipo, ModeloRepuesto, CategoriaTecnica, Redirects],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      // Neon: usar SIEMPRE la cadena de conexión POOLED (host con `-pooler`).
      // Drizzle mantiene un pool pensado para servidor persistente; en serverless
      // la cadena directa satura los límites de conexión. Ver .env.example.
      connectionString: process.env.DATABASE_URI || "",
    },
    /*
     * El push automático de esquema SOLO en desarrollo local.
     *
     * En producción el esquema se aplica con migraciones versionadas
     * (`npm run migrate`), no con push: el push compara y altera el esquema en
     * caliente, sin control de versiones ni posibilidad de revertir. Ver README
     * y el riesgo registrado en CLAUDE.md §10.2.
     */
    push: process.env.NODE_ENV !== "production",
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  sharp,
  plugins: [
    // Almacenamiento de `media` en Vercel Blob. El plugin desactiva el
    // almacenamiento en disco local (Vercel = FS de solo lectura en producción).
    vercelBlobStorage({
      enabled: true,
      collections: {
        // `disablePayloadAccessControl: true` hace que `doc.url` sea la URL
        // pública del CDN del Blob en vez de la ruta interna /api/media/file/...
        // Las imágenes de catálogo son públicas (Media tiene `read: () => true`)
        // y servirlas desde el CDN evita dos saltos de serverless por foto,
        // lo que pesa en Core Web Vitals y por tanto en SEO. Ver ADR 0003.
        [Media.slug]: { disablePayloadAccessControl: true },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
