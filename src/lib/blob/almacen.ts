/**
 * GUARDA DEL ALMACÉN DE BLOB (fase 6, CLAUDE.md §10.37).
 *
 * Identifica el almacén del token activo SIN ESCRIBIR NADA: por el id que lleva
 * el propio token (`vercel_blob_rw_<id>_<secreto>`). El id es público —va en
 * cada URL de imagen—; el secreto nunca se devuelve ni se imprime.
 *
 * Qué almacén se espera en cada entorno:
 *
 * | Entorno                                   | Almacén esperado |
 * | ----------------------------------------- | ---------------- |
 * | Vercel, `VERCEL_ENV=production`           | producción       |
 * | Vercel, cualquier otro (`preview`, …)     | preview          |
 * | Fuera de Vercel (development, scripts)    | preview          |
 *
 * Una operación pensada para producción fuera de Vercel (un runbook de
 * dirección) lo declara con `ALMACEN_BLOB_ESPERADO=<id>`: nunca se deduce.
 *
 * Por qué existe: el 2026-10-01 una subida de prueba desde development fue al
 * almacén de PRODUCCIÓN porque el almacén se comprobó ESCRIBIENDO, después de
 * subir. La regla: el almacén se comprueba siempre ANTES y sin escribir.
 */

/** Almacenes del proyecto. Identificadores, no secretos. */
export const ALMACEN_PREVIEW = "lsndnc29nh4ws7eh";
export const ALMACEN_PRODUCCION = "sr2s4ngkjzfzpxhi";

/** Id del almacén de un token de Blob, sin el secreto. */
export function almacenDeToken(token: string | undefined): string | null {
  return (
    token
      ?.trim()
      .match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]
      ?.toLowerCase() ?? null
  );
}

type Entorno = Record<string, string | undefined>;

/** Almacén que el entorno DEBE usar. */
export function almacenEsperado(env: Entorno): string {
  const declarado = env.ALMACEN_BLOB_ESPERADO?.trim().toLowerCase();
  if (declarado) return declarado;
  return env.VERCEL_ENV === "production" ? ALMACEN_PRODUCCION : ALMACEN_PREVIEW;
}

export type VeredictoAlmacen =
  | { valido: true; almacen: string; esperado: string }
  | { valido: false; almacen: string | null; esperado: string; motivo: string };

/** ¿El token activo es del almacén que toca? Nunca devuelve el token. */
export function veredictoAlmacen(env: Entorno): VeredictoAlmacen {
  const esperado = almacenEsperado(env);
  const almacen = almacenDeToken(env.BLOB_READ_WRITE_TOKEN);
  if (!almacen) {
    return {
      valido: false,
      almacen: null,
      esperado,
      motivo: "BLOB_READ_WRITE_TOKEN vacío o ilegible",
    };
  }
  if (almacen !== esperado) {
    return {
      valido: false,
      almacen,
      esperado,
      motivo: `el token es del almacén ${almacen} y aquí se espera ${esperado}${almacen === ALMACEN_PRODUCCION ? " (el de PRODUCCIÓN)" : ""}`,
    };
  }
  return { valido: true, almacen, esperado };
}

/** Almacén de una URL pública del Blob, o null si no es del Blob. */
export function almacenDeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return (
      new URL(url).hostname
        .match(/^([a-z\d]+)\.public\.blob\.vercel-storage\.com$/i)?.[1]
        ?.toLowerCase() ?? null
    );
  } catch {
    return null;
  }
}
