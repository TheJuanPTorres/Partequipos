import { APIError, type CollectionBeforeOperationHook } from "payload";

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
 * TOPE DE TAMAÑO: 4 MiB. Las funciones de Vercel cortan el cuerpo de la
 * petición en 4,5 MB (413 `FUNCTION_PAYLOAD_TOO_LARGE`, en todos los planes), y
 * la subida del panel pasa por una función. Con margen para la cabecera
 * multipart. Por encima de 4,5 MB este hook ni siquiera llega a ejecutarse:
 * Vercel corta antes. Ver docs/diseno/decisiones-home-ux9.md §4.
 */
export const TOPE_VIDEO_BYTES = 4 * 1024 * 1024;

export const formatoDeVideoPermitido: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data) || file.data.length === 0) return args;

  if (!esVideoPermitido(file.data)) {
    throw new APIError(
      `«${file.name}» no es un vídeo MP4 ni WebM. Si el nombre acaba en .mp4 pero el contenido es ` +
        `de otro formato, también se rechaza.`,
      400,
    );
  }

  if (file.data.length > TOPE_VIDEO_BYTES) {
    const mb = (file.data.length / (1024 * 1024)).toFixed(1).replace(".", ",");
    throw new APIError(
      `«${file.name}» pesa ${mb} MB y el máximo es 4 MB. Un vídeo de fondo no necesita más: ` +
        `hay que exportarlo con más compresión (H.264 de 8 bits) y volver a subirlo.`,
      400,
    );
  }

  return args;
};
