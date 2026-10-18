/**
 * D4 EN MAQUINARIA NUEVA (dirección, 2026-10-14): una página de tipo de
 * maquinaria nueva sin equipos no se indexa (`noindex, follow`) ni sale en el
 * sitemap; la URL sigue en 200 con su estado vacío. Vuelve sola con el primer
 * equipo: guardarlo revalida la página del tipo y el sitemap es dinámico.
 *
 * Un tipo «paraguas» (con `subtipos`, campo «Tipos que agrupa») lista los equipos
 * de sus subtipos, así que cuenta como con equipos si alguno de ellos los tiene
 * (#238; megamenú, páginas de marca y sitemap usan esta misma regla).
 *
 * Puro, para probarlo sin base: recibe los equipos (y, opcionalmente, los tipos
 * con sus subtipos) y devuelve los ids de los tipos que tienen alguno (las
 * relaciones llegan como id o pobladas).
 */
type Rel = number | { id: number } | null | undefined;
const idDe = (r: Rel) => (typeof r === "number" ? r : r && typeof r === "object" ? r.id : null);

export function tiposConEquipos(
  equipos: ReadonlyArray<{ tipo: Rel }>,
  tipos: ReadonlyArray<{ id: number; subtipos?: ReadonlyArray<Rel> | null }> = [],
): Set<number> {
  const ids = new Set<number>();
  for (const { tipo } of equipos) {
    const id = idDe(tipo);
    if (id !== null) ids.add(id);
  }
  for (const t of tipos) {
    if ((t.subtipos ?? []).some((s) => ids.has(idDe(s) ?? -1))) ids.add(t.id);
  }
  return ids;
}

/**
 * ¿Cambia el megamenú porque un equipo se crea, se borra o cambia de tipo? Solo si
 * cambia QUÉ tipos tienen equipos (el menú enlaza únicamente a los que tienen):
 * - crear: si el tipo se queda con uno solo, acaba de aparecer;
 * - borrar: si el tipo se queda con ninguno, acaba de desaparecer;
 * - cambiar de tipo: puede ocurrir en cualquiera de los dos.
 * Así no se revalida el sitio entero por cada equipo que se guarda.
 */
export function cambiaElMenuPorEquipo(datos: {
  operacion: "create" | "update" | "delete";
  tipo: number | null | undefined;
  tipoAnterior?: number | null | undefined;
  /** Equipos del tipo DESPUÉS de la operación. */
  equiposDelTipo: number;
}): boolean {
  if (datos.operacion === "create") return datos.equiposDelTipo === 1;
  if (datos.operacion === "delete") return datos.equiposDelTipo === 0;
  return (datos.tipoAnterior ?? null) !== (datos.tipo ?? null);
}
