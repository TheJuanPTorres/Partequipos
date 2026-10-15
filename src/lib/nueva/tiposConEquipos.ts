/**
 * D4 EN MAQUINARIA NUEVA (dirección, 2026-10-14): una página de tipo de
 * maquinaria nueva sin equipos no se indexa (`noindex, follow`) ni sale en el
 * sitemap; la URL sigue en 200 con su estado vacío. Vuelve sola con el primer
 * equipo: guardarlo revalida la página del tipo y el sitemap es dinámico.
 *
 * Puro, para probarlo sin base: recibe los equipos y devuelve los ids de los
 * tipos que tienen alguno (la relación llega como id o poblada).
 */
export function tiposConEquipos(
  equipos: ReadonlyArray<{ tipo: number | { id: number } | null | undefined }>,
): Set<number> {
  const ids = new Set<number>();
  for (const { tipo } of equipos) {
    if (typeof tipo === "number") ids.add(tipo);
    else if (tipo && typeof tipo === "object") ids.add(tipo.id);
  }
  return ids;
}
