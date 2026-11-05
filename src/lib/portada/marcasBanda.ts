/**
 * «Marcas de la banda» (2026-11-05, dirección): en la portada, la sección «Marcas de repuestos»
 * pinta las marcas ELEGIDAS en el panel («inicio» → «Marcas de repuestos» → «Marcas de la banda»),
 * en el orden en que se arrastraron. Con la lista vacía, como siempre: todas las marcas de
 * repuestos con logo, por orden alfabético.
 *
 * Funciones puras: la consulta de las marcas (con su logo de la regla común) no cambia, y aquí solo
 * se eligen y se ordenan.
 */

/** Lo que guarda el campo de relación: ids, o los documentos si la consulta los trajo poblados. */
export type ValorRelacion = number | string | { id: number | string } | null | undefined;

/** Los ids elegidos, en su orden, sin repetidos ni huecos. */
export function idsElegidos(valor: readonly ValorRelacion[] | null | undefined): number[] {
  const vistos = new Set<number>();
  const ids: number[] = [];
  for (const v of valor ?? []) {
    const crudo = typeof v === "object" && v !== null ? v.id : v;
    const id = typeof crudo === "string" ? Number(crudo) : crudo;
    if (typeof id !== "number" || !Number.isInteger(id) || vistos.has(id)) continue;
    vistos.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Las marcas de la banda: las elegidas en su orden o, sin ninguna elegida, todas tal como llegan
 * (alfabético). Una elegida que ya no se pinta —sin logo, sin dirección o borrada— no deja hueco.
 */
export function marcasDeLaBanda<M extends { id: number }>(
  todas: readonly M[],
  elegidas: readonly ValorRelacion[] | null | undefined,
): M[] {
  const ids = idsElegidos(elegidas);
  if (ids.length === 0) return [...todas];
  const porId = new Map(todas.map((m) => [m.id, m]));
  return ids.flatMap((id) => {
    const m = porId.get(id);
    return m ? [m] : [];
  });
}

/** Validación del campo en el servidor: la misma marca no puede elegirse dos veces. */
export function validarMarcasSinRepetir(
  valor: readonly ValorRelacion[] | null | undefined,
): true | string {
  const lista = (valor ?? []).filter((v) => v !== null && v !== undefined);
  return idsElegidos(lista).length === lista.length
    ? true
    : "Hay una marca repetida en «Marcas de la banda». Quita la copia: cada marca sale una vez.";
}
