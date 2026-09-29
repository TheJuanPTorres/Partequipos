/**
 * ENTORNO DEL PREVIEW para los scripts que Claude Code ejecuta solo
 * (CLAUDE.md §9, «Modo de trabajo»). Los secretos viven en
 * `.env.preview.local`, que rellena dirección y que nadie imprime: aquí solo se
 * DECIDE si ese entorno es el del preview. Los guardas propios de cada script
 * (`puedeTocarHeroDePrueba`) siguen mandando además de este.
 */
import {
  ALMACEN_PREVIEW,
  ALMACEN_PRODUCCION,
  HOST_PRODUCCION,
  almacenDeToken,
} from "../portada/heroPrueba";
import { HOST_PREVIEW, hostDeConexion } from "../db/vaciadoSolicitudes";

export const FICHERO_ENTORNO_PREVIEW = ".env.preview.local";

/** Claves que el fichero puede aportar. Cualquier otra se ignora. */
export const CLAVES_PREVIEW = [
  "DATABASE_URI",
  "BLOB_READ_WRITE_TOKEN",
  "VERCEL_AUTOMATION_BYPASS_SECRET",
] as const;
type Clave = (typeof CLAVES_PREVIEW)[number];

/** `CLAVE=valor` por línea; comentarios con `#`; comillas opcionales. */
export function leerFicheroEntorno(texto: string): Partial<Record<Clave, string>> {
  const salida: Partial<Record<Clave, string>> = {};
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const clave = m[1] as Clave;
    if (!CLAVES_PREVIEW.includes(clave)) continue;
    salida[clave] = m[2]!.replace(/^(["'])(.*)\1$/, "$2");
  }
  return salida;
}

export type VeredictoPreview =
  | { valido: true; host: string; almacen: string; bypass: "presente" | "VACIO" }
  | { valido: false; motivo: string; host: string | null; almacen: string | null };

/**
 * Solo vale la base Y el almacén del preview. Producción se nombra aparte para
 * que el mensaje no deje dudas. Sin el secreto de bypass el entorno sigue
 * siendo válido (sembrar no lo necesita); se informa como «VACIO».
 */
export function veredictoEntornoPreview(env: Partial<Record<Clave, string>>): VeredictoPreview {
  const uri = env.DATABASE_URI?.trim();
  const host = uri ? hostDeConexion(uri) : null;
  const almacen = almacenDeToken(env.BLOB_READ_WRITE_TOKEN?.trim());
  const fallo = (motivo: string): VeredictoPreview => ({ valido: false, motivo, host, almacen });

  if (host === HOST_PRODUCCION || host?.includes("ep-tiny-fog")) {
    return fallo("DATABASE_URI apunta a PRODUCCIÓN");
  }
  if (almacen === ALMACEN_PRODUCCION) return fallo("BLOB_READ_WRITE_TOKEN es el de PRODUCCIÓN");
  if (!host) return fallo("DATABASE_URI vacía o ilegible");
  if (host !== HOST_PREVIEW) return fallo(`la base no es la del preview (${HOST_PREVIEW})`);
  if (!almacen) return fallo("BLOB_READ_WRITE_TOKEN vacío o ilegible");
  if (almacen !== ALMACEN_PREVIEW)
    return fallo(`el Blob no es el del preview (${ALMACEN_PREVIEW})`);
  return {
    valido: true,
    host,
    almacen,
    bypass: env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() ? "presente" : "VACIO",
  };
}
