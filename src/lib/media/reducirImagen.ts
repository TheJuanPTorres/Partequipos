/**
 * FOTOS AL SUBIR (dirección, 2026-11-20): en el panel, una imagen se reduce SOLA antes de subir,
 * en el navegador del editor (`ManejadorSubidaDirecta`):
 *
 * - como mucho {@link ANCHO_MAXIMO} px de ancho (el mayor tamaño que pide el sitio), con su
 *   proporción; una imagen más pequeña NUNCA se amplía;
 * - en WebP de buena calidad;
 * - y, si el original pesaba demasiado, un aviso al editor.
 *
 * Solo lo que se suba desde ahora por el panel: las imágenes ya guardadas y los importadores por
 * script no cambian. Aquí va la parte PURA (medidas, nombres, decisiones y textos); el dibujo en
 * el lienzo está en `src/components/admin/reducirEnNavegador.ts`.
 */

/** Ancho máximo, en píxeles: el mayor de los `deviceSizes` de `next/image`. */
export const ANCHO_MAXIMO = 3840;

/** Calidad del WebP (0–1): fotos, y algo más para un PNG (logos y recortes, con bordes finos). */
export const CALIDAD_WEBP = 0.86;
export const CALIDAD_WEBP_PNG = 0.92;
/** Calidad del JPEG de respaldo, en un navegador que no sabe escribir WebP. */
export const CALIDAD_JPEG = 0.88;

const MB = 1024 * 1024;
/** Desde este peso, el original «pesa demasiado»: se sube reducido y se avisa. */
export const AVISO_ORIGINAL_BYTES = 8 * MB;
/** Por encima, ni se intenta: el navegador puede quedarse sin memoria al abrirla. */
export const TOPE_ORIGINAL_BYTES = 60 * MB;

export type Medidas = { ancho: number; alto: number };

/** Las medidas con las que se sube: las mismas, o reducidas al ancho máximo. Nunca mayores. */
export function medidasReducidas(
  original: Medidas,
  maximo = ANCHO_MAXIMO,
): Medidas & { reducida: boolean } {
  const { ancho, alto } = original;
  if (!(ancho > maximo)) return { ancho, alto, reducida: false };
  return { ancho: maximo, alto: Math.max(1, Math.round((alto * maximo) / ancho)), reducida: true };
}

const EXTENSION: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** El nombre con la extensión del formato en que se sube («foto.JPG» → «foto.webp»). */
export function nombreCon(nombre: string, tipo: string): string {
  const extension = EXTENSION[tipo];
  if (!extension) return nombre;
  const punto = nombre.lastIndexOf(".");
  const base = punto > 0 ? nombre.slice(0, punto) : nombre;
  return `${base}.${extension}`;
}

/** La calidad con la que se escribe, según el formato de salida y el de origen. */
export function calidadPara(tipoSalida: string, tipoOrigen: string): number {
  if (tipoSalida === "image/jpeg") return CALIDAD_JPEG;
  return tipoOrigen === "image/png" ? CALIDAD_WEBP_PNG : CALIDAD_WEBP;
}

type Fichero = { type: string; size: number };

/**
 * Qué se sube: el resultado del navegador o el original.
 *
 * - Si se redujo, siempre el resultado.
 * - Si no hizo falta reducir: el WebP, salvo que el original ya lo fuera o que el WebP pese MÁS
 *   (un JPEG ya muy comprimido): entonces el original, tal cual. Nunca se empeora un fichero.
 * - Si el navegador no supo escribir WebP y no había que reducir, el original.
 */
export function queSubir(
  original: Fichero,
  resultado: Fichero | null,
  reducida: boolean,
): "resultado" | "original" {
  if (!resultado || resultado.size === 0) return "original";
  if (reducida) return "resultado";
  if (resultado.type !== "image/webp" || original.type === "image/webp") return "original";
  return resultado.size < original.size ? "resultado" : "original";
}

export const enMb = (bytes: number) => (bytes / MB).toFixed(1).replace(".", ",").replace(/,0$/, "");

/** El aviso de «demasiado grande para reducirla sola»; `null` si se puede intentar. */
export function avisoDeTope(fichero: { name: string; size: number }): string | null {
  if (fichero.size <= TOPE_ORIGINAL_BYTES) return null;
  return (
    `«${fichero.name}» pesa ${enMb(fichero.size)} MB: es demasiado para reducirla aquí ` +
    `(máximo ${enMb(TOPE_ORIGINAL_BYTES)} MB). Expórtala a ${ANCHO_MAXIMO} px de ancho como mucho ` +
    `y vuelve a intentarlo. No se ha subido nada.`
  );
}

/**
 * El aviso de «el original pesaba demasiado» (no impide subir); `null` si no pesaba tanto.
 * `subida` es lo que se subió de verdad.
 */
export function avisoDeOriginalPesado(
  original: { name: string; size: number; medidas: Medidas | null },
  subida: { size: number; medidas: Medidas | null; type: string; cambiada: boolean },
): string | null {
  if (original.size < AVISO_ORIGINAL_BYTES) return null;
  const de = original.medidas ? ` (${original.medidas.ancho} × ${original.medidas.alto} px)` : "";
  const consejo = `La próxima vez, expórtala a ${ANCHO_MAXIMO} px de ancho como mucho.`;
  if (!subida.cambiada) {
    return `«${original.name}» pesa ${enMb(original.size)} MB${de}: es mucho para la web. ${consejo}`;
  }
  const a = subida.medidas ? `${subida.medidas.ancho} × ${subida.medidas.alto} px, ` : "";
  const formato =
    subida.type === "image/webp" ? "WebP" : subida.type === "image/jpeg" ? "JPEG" : "PNG";
  return (
    `«${original.name}» pesaba ${enMb(original.size)} MB${de}: es mucho para la web. ` +
    `Se ha subido reducida (${a}${formato}, ${enMb(subida.size)} MB). ${consejo}`
  );
}
