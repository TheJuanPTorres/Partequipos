import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Articulo } from "./collections/Articulo";
import { CategoriaBlog } from "./collections/CategoriaBlog";
import { CategoriaLubricante } from "./collections/CategoriaLubricante";
import { CategoriaMaquinaria } from "./collections/CategoriaMaquinaria";
import { CategoriaTecnica } from "./collections/CategoriaTecnica";
import { CategoriaUsada } from "./collections/CategoriaUsada";
import { EquipoNuevo } from "./collections/EquipoNuevo";
import { EquipoUsado } from "./collections/EquipoUsado";
import { Marca } from "./collections/Marca";
import { MarcaLubricante } from "./collections/MarcaLubricante";
import { MarcaMaquinaria } from "./collections/MarcaMaquinaria";
import { Media } from "./collections/Media";
import { ModeloRepuesto } from "./collections/ModeloRepuesto";
import { PaginaInstitucional } from "./collections/PaginaInstitucional";
import { Redirects } from "./collections/Redirects";
import { Solicitud } from "./collections/Solicitud";
import { TipoEquipo } from "./collections/TipoEquipo";
import { TipoMaquinaria } from "./collections/TipoMaquinaria";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/*
 * Adaptador de correo (Resend), OPCIONAL a propósito.
 *
 * Sin `RESEND_API_KEY` no se configura ningún adaptador: Payload deja entonces
 * `sendEmail` como una operación que solo registra el intento. El aviso de una
 * solicitud nueva se pierde, pero **la solicitud se guarda igual** — el hook que
 * notifica captura su propio error y nunca lo relanza.
 *
 * Es deliberado y es lo que hay que preservar al tocar esto: una caída del
 * correo, una clave caducada o una cuota agotada no pueden costar un lead, que
 * es el objetivo comercial del proyecto. Ver `notificarSolicitud.ts`.
 */
const email = process.env.RESEND_API_KEY
  ? resendAdapter({
      apiKey: process.env.RESEND_API_KEY,
      // Resend exige que el remitente sea de un dominio verificado en la cuenta.
      defaultFromAddress: process.env.RESEND_FROM_EMAIL || "",
      defaultFromName: process.env.RESEND_FROM_NAME || "Partequipos",
    })
  : undefined;

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
    // Lubricantes: marca -> categoria de aplicacion. Dos niveles, no tres.
    MarcaLubricante,
    CategoriaLubricante,
    // Blog. Los articulos se sirven en la raiz /{slug}/, igual que las paginas
    // institucionales: de ahi el guardarrail de unicidad entre ambas.
    CategoriaBlog,
    Articulo,
    // Leads de los formularios publicos. Unica coleccion con datos personales:
    // su control de acceso de lectura es privado, no publico como el catalogo.
    Solicitud,
  ],
  editor: lexicalEditor(),
  email,
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
