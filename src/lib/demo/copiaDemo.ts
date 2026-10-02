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
