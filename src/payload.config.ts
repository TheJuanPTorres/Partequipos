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
  collections: [Users, Media, Marca, TipoEquipo, ModeloRepuesto, CategoriaTecnica],
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
  }),
  sharp,
  plugins: [
    // Almacenamiento de `media` en Vercel Blob. El plugin desactiva el
    // almacenamiento en disco local (Vercel = FS de solo lectura en producción).
    vercelBlobStorage({
      enabled: true,
      collections: {
        [Media.slug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || "",
    }),
  ],
});
