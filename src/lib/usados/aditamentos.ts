/**
 * ADITAMENTOS USADOS: «Serial» y «Descripción corta» (2026-10-23, dirección).
 * Puro, sin Payload ni React: lo usan el panel (los campos solo se ven en la
 * categoría Aditamentos), la ficha y las tarjetas del listado.
 *
 * El serial es una EXCEPCIÓN, solo para aditamentos, a la regla de 2026-10-07
 * («el número de serie no sale en ningún sitio»), que sigue valiendo para la
 * maquinaria usada: un aditamento sin serial no se distingue de otro igual, y
 * dirección lo pide a la vista. Por eso solo se pinta si la unidad es de la
 * categoría Aditamentos, aunque el campo tenga valor.
 */

/** La dirección web de la categoría de usados de aditamentos. */
export const CATEGORIA_ADITAMENTOS = "aditamentos";

/** Un serial de fabricante cabe de sobra; más largo sería otra cosa pegada por error. */
export const MAX_SERIAL = 40;

/**
 * La tarjeta enseña como mucho 3 líneas de unos 45 caracteres (la columna más
 * estrecha, a 1010 px): 140 llenan esas 3 líneas sin cortar casi nunca. Más
 * texto va a la descripción de la ficha.
 */
export const MAX_DESCRIPCION_CORTA = 140;

export const esDeAditamentos = (categoriaSlug: string | null | undefined): boolean =>
  categoriaSlug === CATEGORIA_ADITAMENTOS;

/** El texto sin espacios de más; vacío, `null`. */
export function textoLimpio(v: string | null | undefined): string | null {
  const t = v?.replace(/\s+/g, " ").trim();
  return t ? t : null;
}

/** Lo que se pinta de un aditamento: los dos campos, solo en su categoría. */
export function camposDeAditamento(
  categoriaSlug: string | null | undefined,
  u: { serial?: string | null; descripcionCorta?: string | null },
): { serial: string | null; descripcionCorta: string | null } {
  if (!esDeAditamentos(categoriaSlug)) return { serial: null, descripcionCorta: null };
  return { serial: textoLimpio(u.serial), descripcionCorta: textoLimpio(u.descripcionCorta) };
}
