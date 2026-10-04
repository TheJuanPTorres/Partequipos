/**
 * COPIA DE DEMOSTRACIÓN del preview a producción (CLAUDE.md §10.38). Lógica
 * pura: la guarda del destino, el origen y las claves de idempotencia. El
 * acceso a datos está en `scripts/demo/copia-demo.ts`.
 */
import { ALMACEN_PREVIEW, ALMACEN_PRODUCCION, almacenDeToken } from "../blob/almacen";
import { HOST_PREVIEW, hostDeConexion } from "../db/vaciadoSolicitudes";
import { HOST_PRODUCCION } from "../portada/heroPrueba";

export type Destino = "produccion" | "prueba";

/** Base de `development` (Neon). No es desechable: nunca vale como destino de prueba. */
export const HOST_DEVELOPMENT = "ep-aged-forest-aw4bua7l-pooler.c-12.us-east-1.aws.neon.tech";

export type VeredictoDestino =
  { valido: true; almacen: string; host: string } | { valido: false; motivo: string };

/**
 * El destino tiene que ser EXPLÍCITO y cuadrar con la base y el almacén de la
 * sesión:
 * - `produccion`: base de producción Y token del almacén de producción.
 * - `prueba`: una base DESECHABLE (una rama temporal de Neon que crea
 *   dirección, o una local) Y el almacén del preview; nunca la base de
 *   producción, la del preview ni la de development.
 */
export function veredictoDestino(
  destino: string | undefined,
  databaseUri: string | undefined,
  token: string | undefined,
): VeredictoDestino {
  if (destino !== "produccion" && destino !== "prueba") {
    return { valido: false, motivo: "indica el destino: «produccion» o «prueba»" };
  }
  const host = databaseUri?.trim() ? hostDeConexion(databaseUri.trim()) : null;
  const almacen = almacenDeToken(token);
  if (!host) return { valido: false, motivo: "sin DATABASE_URI" };
  if (!almacen) return { valido: false, motivo: "sin BLOB_READ_WRITE_TOKEN legible" };
  if (destino === "produccion") {
    if (host !== HOST_PRODUCCION)
      return { valido: false, motivo: `la base «${host}» no es la de producción` };
    if (almacen !== ALMACEN_PRODUCCION)
      return { valido: false, motivo: `el token es del almacén ${almacen}, no del de producción` };
    return { valido: true, almacen, host };
  }
  if (host === HOST_PRODUCCION || host === HOST_PREVIEW || host === HOST_DEVELOPMENT) {
    return {
      valido: false,
      motivo: `la base «${host}» no es desechable (es la de producción, preview o development)`,
    };
  }
  if (almacen !== ALMACEN_PREVIEW)
    return { valido: false, motivo: `el token es del almacén ${almacen}, no del preview` };
  return { valido: true, almacen, host };
}

/** El origen es un despliegue de PREVIEW (URL fija de Vercel), nunca producción. */
export function origenValido(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    if (!/^partequipos-[a-z0-9]+-thejuanptorres-projects\.vercel\.app$/.test(u.hostname))
      return null;
    return u.origin;
  } catch {
    return null;
  }
}

/**
 * Marca del contenido de ejemplo de ux-9 que siembra `preview:ejemplo:sembrar`
 * (en el `alt` de sus imágenes y al principio de la descripción de las fichas).
 */
export const MARCA_EJEMPLO = "EJEMPLO UX-9 —";

/** ¿Es contenido de ejemplo de ux-9? (por su marca, al principio del texto). */
export const esDeEjemplo = (texto: string | null | undefined) =>
  texto?.trimStart().startsWith(MARCA_EJEMPLO) ?? false;

/** Claves naturales con las que la copia reconoce lo que ya existe en el destino. */
export const clave = {
  /*
   * Nombre Y descripción: las 6 fichas de ejemplo de ux-9 se llaman igual
   * («Excavadora Hitachi ZX75US-7») y solo las distingue la descripción.
   */
  equipo: (e: { nombre?: string | null; descripcion?: string | null }) =>
    [e.nombre, e.descripcion].map((x) => x?.trim().toLowerCase() ?? "").join("|"),
  testimonio: (t: { empresa?: string | null; nombre?: string | null; cita?: string | null }) =>
    [t.empresa, t.nombre, t.cita].map((x) => x?.trim().toLowerCase() ?? "").join("|"),
  pregunta: (p: { pregunta?: string | null }) => p.pregunta?.trim().toLowerCase() ?? "",
  sede: (s: { nombre?: string | null }) => s.nombre?.trim().toLowerCase() ?? "",
};

/** Referencia de autorización con la que entran los testimonios (§10.38). */
export const REFERENCIA_AUTORIZACION =
  "§10.38 — excepción temporal de demostración (2026-10-02). La autorización de las personas es responsabilidad del cliente.";

/*
 * NOMBRES DE LOS FICHEROS COPIADOS (decisión de dirección, 2026-10-03).
 *
 * La copia subía cada fichero con su nombre ORIGINAL. En modo «prueba» el
 * destino comparte almacén con el origen (el del preview), así que la copia
 * sobrescribía el fichero del origen y la retirada lo BORRABA: el preview
 * perdió así 36 imágenes y un vídeo (docs/diseno/decisiones-nosotros.md).
 *
 * Desde ahora, en TODOS los modos:
 * 1. Todo fichero copiado lleva nombre propio, con el prefijo `demo-copia-`.
 * 2. La copia se niega si la URL de destino ya existe o coincide con la de
 *    origen (antes de subir y, otra vez, con la URL que devuelve Payload).
 * 3. La retirada solo borra URLs que estén en su manifiesto Y lleven el
 *    prefijo.
 */
export const PREFIJO_COPIA = "demo-copia-";

/** Nombre del fichero en una URL, sin decodificar fallos. */
function nombreDeUrl(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  } catch {
    return "";
  }
}

/** Mismo fichero: mismo host y mismo nombre, sin distinguir la codificación. */
function mismaUrl(a: string, b: string): boolean {
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.host.toLowerCase() === y.host.toLowerCase() && nombreDeUrl(a) === nombreDeUrl(b);
  } catch {
    return a === b;
  }
}

/** Nombre con el que se sube la copia de un fichero. Idempotente. */
export function nombreDeCopia(original: string): string {
  const base = original.trim();
  return base.startsWith(PREFIJO_COPIA) ? base : `${PREFIJO_COPIA}${base}`;
}

/** URL pública que tendrá un fichero en un almacén de Vercel Blob. */
export function urlEnAlmacen(almacen: string, nombre: string): string {
  return `https://${almacen}.public.blob.vercel-storage.com/${encodeURIComponent(nombre)}`;
}

export type VeredictoFichero = { valido: true } | { valido: false; motivo: string };

/**
 * ANTES de subir: la URL prevista lleva el prefijo, no es la del origen y no
 * existe ya en el destino. `existeEnDestino` lo decide quien llama (un HEAD
 * que no dé 404 cuenta como «existe»: ante la duda, no se sube).
 */
export function veredictoSubida(p: {
  urlOrigen: string;
  urlPrevista: string;
  existeEnDestino: boolean;
}): VeredictoFichero {
  if (!nombreDeUrl(p.urlPrevista).startsWith(PREFIJO_COPIA))
    return { valido: false, motivo: `la URL de destino no lleva el prefijo ${PREFIJO_COPIA}` };
  if (mismaUrl(p.urlOrigen, p.urlPrevista))
    return { valido: false, motivo: "la URL de destino coincide con la de origen" };
  if (p.existeEnDestino) return { valido: false, motivo: "la URL de destino ya existe" };
  return { valido: true };
}

/** DESPUÉS de subir: lo que creó Payload lleva el prefijo y no es el origen. */
export function veredictoCreado(p: {
  urlOrigen: string;
  urlCreada: string | null | undefined;
}): VeredictoFichero {
  if (!p.urlCreada) return { valido: false, motivo: "Payload no devolvió la URL creada" };
  if (!nombreDeUrl(p.urlCreada).startsWith(PREFIJO_COPIA))
    return { valido: false, motivo: `el fichero creado no lleva el prefijo ${PREFIJO_COPIA}` };
  if (mismaUrl(p.urlOrigen, p.urlCreada))
    return { valido: false, motivo: "el fichero creado es el mismo que el de origen" };
  return { valido: true };
}

/** La retirada solo borra lo que está en su manifiesto Y lleva el prefijo. */
export function puedeRetirar(url: string | null | undefined, urlsDelManifiesto: string[]): boolean {
  if (!url) return false;
  if (!nombreDeUrl(url).startsWith(PREFIJO_COPIA)) return false;
  return urlsDelManifiesto.some((u) => mismaUrl(u, url));
}
