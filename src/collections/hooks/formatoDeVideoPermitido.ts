import { APIError, type CollectionBeforeOperationHook } from "payload";

import { borrarHuerfanoRechazado, llegoPorSubidaDirecta } from "../../lib/blob/huerfanoRechazado";
import { muestraDelFichero } from "../../lib/blob/muestraDelFichero";
import { REGLAS_SUBIDA_DIRECTA } from "../../lib/blob/subidaDirecta";

/**
 * Rechaza subidas a `videos` que no sean MP4 o WebM POR CONTENIDO, o que pasen
 * del tope de tamaño, con mensajes en español. Mismo criterio que
 * `formatoDeImagenPermitido`: Payload valida `mimeTypes` detrás, en inglés.
 *
 * CUIDADO CON LA CAJA `ftyp`. MP4, AVIF y HEIC empiezan igual (una caja `ftyp`
 * en el byte 4). Lo que los distingue es la MARCA que sigue, así que aquí va una
 * LISTA DE PERMITIDOS de marcas de vídeo, no «cualquier `ftyp`»: si no, un AVIF
 * —el formato del CVE que restringe `Media` (CLAUDE.md §10.28)— pasaría por
 * vídeo.
 */

/** Marcas `ftyp` de MP4 y familia (ISO/IEC 14496-12 y 14). */
const MARCAS_MP4 = new Set([
  "isom",
  "iso2",
  "iso4",
  "iso5",
  "iso6",
  "mp41",
  "mp42",
  "avc1",
  "dash",
  "M4V ",
]);

export function esVideoPermitido(b: Buffer): "MP4" | "WebM" | null {
  if (b.length >= 12 && b.subarray(4, 8).toString("ascii") === "ftyp") {
    return MARCAS_MP4.has(b.subarray(8, 12).toString("ascii")) ? "MP4" : null;
  }
  // WebM es EBML (1A 45 DF A3) con tipo de documento «webm» en la cabecera.
  if (
    b.length >= 4 &&
    b[0] === 0x1a &&
    b[1] === 0x45 &&
    b[2] === 0xdf &&
    b[3] === 0xa3 &&
    b.subarray(0, 64).includes(Buffer.from("webm", "ascii"))
  ) {
    return "WebM";
  }
  return null;
}

/**
 * TOPE DE TAMAÑO: 10 MB desde el 2026-10-17 (dirección). Los vídeos suben por la
 * SUBIDA DIRECTA del navegador al Blob (§10.39), porque la vía normal pasa por una
 * función y Vercel la corta en 4,5 MB. Con subida directa `req.file.data` llega
 * VACÍO y el fichero está en un temporal: se lee de ahí (`muestraDelFichero`), se
 * guarda el tamaño REAL y, si se rechaza, se borra del Blob.
 */
export const TOPE_VIDEO_BYTES = REGLAS_SUBIDA_DIRECTA.videos?.maximo ?? 10 * 1024 * 1024;

export const formatoDeVideoPermitido: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  const muestra = muestraDelFichero(file, 64);
  if (!file || !muestra) return args;

  const rechazar = async (mensaje: string): Promise<never> => {
    if (llegoPorSubidaDirecta(file)) await borrarHuerfanoRechazado(file.name);
    throw new APIError(mensaje, 400);
  };

  if (!esVideoPermitido(muestra.inicio)) {
    await rechazar(
      `«${file.name}» no es un vídeo MP4 ni WebM. Si el nombre acaba en .mp4 pero el contenido es ` +
        `de otro formato, también se rechaza.`,
    );
  }

  if (muestra.tamano > TOPE_VIDEO_BYTES) {
    const mb = (muestra.tamano / (1024 * 1024)).toFixed(1).replace(".", ",");
    await rechazar(
      `«${file.name}» pesa ${mb} MB y el máximo es ${Math.round(TOPE_VIDEO_BYTES / (1024 * 1024))} MB. ` +
        `Un vídeo de fondo no necesita más: hay que exportarlo con más compresión (H.264 de 8 bits) ` +
        `y volver a subirlo.`,
    );
  }

  // El tamaño que se guarda es el REAL, no el que dijo el navegador.
  file.size = muestra.tamano;
  return args;
};
