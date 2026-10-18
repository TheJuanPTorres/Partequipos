import type { EquiposNuevo, TiposMaquinaria } from "@/payload-types";

/**
 * TIPOS «PARAGUAS» de maquinaria nueva (auditoría de estructura, 2026-10-17,
 * decisión de dirección): un tipo con `subtipos` (Compactadores y Pavimentadoras
 * de Dynapac) lista en su página los equipos de esos tipos, por grupos, como en
 * WordPress. Lógica pura: la página solo consulta y pinta.
 */

/** Los subtipos poblados de un tipo, en el orden elegido en el panel. */
export function subtiposDe(tipo: TiposMaquinaria): TiposMaquinaria[] {
  return (tipo.subtipos ?? []).filter(
    (s): s is TiposMaquinaria => typeof s === "object" && s !== null,
  );
}

export type GrupoDeSubtipo = { tipo: TiposMaquinaria; equipos: EquiposNuevo[] };

/**
 * Un grupo por subtipo con sus equipos, en el orden de los subtipos; los
 * subtipos sin equipos no forman grupo (no dejan un título vacío).
 */
export function gruposDeSubtipos(
  subtipos: TiposMaquinaria[],
  equipos: EquiposNuevo[],
): GrupoDeSubtipo[] {
  const tipoDe = (e: EquiposNuevo) => (typeof e.tipo === "number" ? e.tipo : e.tipo?.id);
  return subtipos
    .map((tipo) => ({ tipo, equipos: equipos.filter((e) => tipoDe(e) === tipo.id) }))
    .filter((g) => g.equipos.length > 0);
}
