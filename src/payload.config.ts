import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { CategoriaMaquinaria } from "./collections/CategoriaMaquinaria";
import { CategoriaTecnica } from "./collections/CategoriaTecnica";
import { CategoriaUsada } from "./collections/CategoriaUsada";
import { EquipoNuevo } from "./collections/EquipoNuevo";
import { EquipoUsado } from "./collections/EquipoUsado";
import { Marca } from "./collections/Marca";
import { MarcaMaquinaria } from "./collections/MarcaMaquinaria";
import { Media } from "./collections/Media";
import { ModeloRepuesto } from "./collections/ModeloRepuesto";
import { PaginaInstitucional } from "./collections/PaginaInstitucional";
import { Redirects } from "./collections/Redirects";
import { TipoEquipo } from "./collections/TipoEquipo";
import { TipoMaquinaria } from "./collections/TipoMaquinaria";
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
  collections: [
    Users,
    Media,
    Marca,
    TipoEquipo,
    ModeloRepuesto,
    CategoriaTecnica,
    Redirects,
    PaginaInstitucional,
    // Maquinaria (ADR 0007): colecciones propias, separadas de las de repuestos.
    MarcaMaquinaria,
    TipoMaquinaria,
    EquipoNuevo,
    CategoriaMaquinaria,
    CategoriaUsada,
    EquipoUsado,
  ],
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
    /*
     * Se desactiva de dos formas, y basta con una:
     *
     * 1. `NODE_ENV === "production"` — el caso del servidor desplegado.
     * 2. `PAYLOAD_DISABLE_PUSH === "true"` — lo ponen los scripts de datos
     *    (`import`, `seed:paginas`) antes de cargar esta config.
     *
     * El punto 2 existe porque el punto 1 no basta: `payload run` NO fija
     * `NODE_ENV`, así que un script lanzado desde una máquina de desarrollo
     * contra la base de PRODUCCIÓN activaba el push, alteraba el esquema y
     * dejaba el marcador `dev` (batch -1) en `payload_migrations` — lo que
     * después cuelga el build en el prompt de `payload migrate`.
     * Un script de datos nunca debe tocar el esquema. Ver CLAUDE.md §10.9.
     */
    push: process.env.NODE_ENV !== "production" && process.env.PAYLOAD_DISABLE_PUSH !== "true",
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
