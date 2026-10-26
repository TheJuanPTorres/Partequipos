import type { EquiposUsado, Media } from "@/payload-types";

/**
 * LISTADOS DE USADOS CON UNA SOLA FOTO POR UNIDAD (rendimiento, 2026-10-13).
 *
 * Las tarjetas solo pintan la primera foto, pero `depth: 1` poblaba TODAS: en
 * «Excavadoras» del preview, 113 unidades traían 1.247 registros de `Media`
 * para pintar 113. Con ~500 unidades serían más de 5.000 en cada build.
 *
 * Se consulta con `depth: 0` (las fotos llegan como ids), se piden aparte solo
 * las primeras y aquí se cosen: cada unidad queda con `imagenes` = [su primera
 * foto], o vacía si no tiene o la foto ya no existe.
 */

/** El id de la primera foto de cada unidad, sin repetir. */
export function idsDePrimeraImagen(unidades: Pick<EquiposUsado, "imagenes">[]): number[] {
  const ids = new Set<number>();
  for (const u of unidades) {
    const primera = Array.isArray(u.imagenes) ? u.imagenes[0] : null;
    if (primera == null) continue;
    ids.add(typeof primera === "object" ? primera.id : primera);
  }
  return [...ids];
}

/**
 * Cada unidad con `imagenes` reducido a su primera foto, ya poblada. Vale para cualquier colección
 * con `imagenes` (también los modelos de repuestos del panel «Ver todo», 2026-10-25).
 */
export function conPrimeraImagen<T extends Pick<EquiposUsado, "imagenes">>(
  unidades: T[],
  fotos: Media[],
): T[] {
  const porId = new Map(fotos.map((f) => [f.id, f]));
  return unidades.map((u) => {
    const primera = Array.isArray(u.imagenes) ? u.imagenes[0] : null;
    const id = primera == null ? null : typeof primera === "object" ? primera.id : primera;
    const foto = id == null ? undefined : porId.get(id);
    return { ...u, imagenes: foto ? [foto] : [] };
  });
}
