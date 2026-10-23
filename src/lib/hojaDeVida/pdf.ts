import { MAX_PDF_BYTES, MAX_PDF_MB } from "@/lib/hojaDeVida/constantes";

/**
 * ¿ES UN PDF DE VERDAD? Se comprueba el CONTENIDO, no la extensión ni el tipo que declara el
 * navegador (ambos los pone quien envía): un PDF empieza por `%PDF-` (dentro de sus primeros 1024
 * bytes, como admite la especificación) y termina con `%%EOF` (dentro de sus últimos 2048). Un
 * ejecutable, una imagen o un texto renombrado a `.pdf` no pasan.
 *
 * Esto NO analiza el interior del PDF (scripts, adjuntos): el fichero no se abre ni se publica,
 * viaja de adjunto a un correo de personas. Es la comprobación de forma que pide la tarea.
 */
const CABECERA = "%PDF-";
const FINAL = "%%EOF";

const comoTexto = (bytes: Uint8Array) => new TextDecoder("latin1").decode(bytes);

export function validarPdf(
  bytes: Uint8Array,
  nombre: string,
): { ok: true } | { ok: false; mensaje: string } {
  if (bytes.byteLength === 0) {
    return { ok: false, mensaje: "Adjunta tu hoja de vida en PDF." };
  }
  if (bytes.byteLength > MAX_PDF_BYTES) {
    return {
      ok: false,
      mensaje: `El PDF pesa demasiado: el máximo es ${MAX_PDF_MB} MB.`,
    };
  }
  if (!/\.pdf$/i.test(nombre)) {
    return { ok: false, mensaje: "La hoja de vida tiene que ser un archivo PDF." };
  }
  const inicio = comoTexto(bytes.subarray(0, 1024));
  const fin = comoTexto(bytes.subarray(Math.max(0, bytes.byteLength - 2048)));
  if (!inicio.includes(CABECERA) || !fin.includes(FINAL)) {
    return {
      ok: false,
      mensaje: "Ese archivo no es un PDF válido. Adjunta tu hoja de vida en formato PDF.",
    };
  }
  return { ok: true };
}

/** El nombre del adjunto: sin rutas ni caracteres raros, acabado en `.pdf`. */
export function nombreAdjunto(nombre: string, persona: string): string {
  const limpio = (v: string) =>
    v
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
  const base = limpio(persona) || limpio(nombre.replace(/\.pdf$/i, "")) || "hoja-de-vida";
  return `Hoja-de-vida-${base}.pdf`;
}
