/**
 * TIPO ANIDADO DE REPUESTOS (2026-10-17, dirección): un tipo que en WordPress
 * colgaba de OTRO tipo, y cuya URL hay que conservar. Hoy es solo la
 * «Excavadora» de CASE:
 *
 *   …/repuestos-para-maquinaria-pesada-case-construction/
 *     repuestos-para-maquinaria-pesada-cargador-frontal-case-construction/   ← tipo padre
 *       repuestos-para-maquinaria-pesada-excavadora-case-construction/       ← tipo anidado
 *         repuestos-excavadora-case-construction-cx210b/                     ← sus modelos
 *
 * El tipo guarda «Cuelga de» (`tipoPadre`) y, desnormalizado por el servidor,
 * el slug de ese padre (`slugPadre`). Su SEGMENTO en la URL es entonces
 * `<slugPadre>/<slug>`, y `rutas.tipo` / `rutas.modelo` lo componen sin
 * cambiar. Un solo nivel: un tipo con padre no puede ser padre.
 * Detalle en docs/repuestos-importacion.md §9.
 */

type ConSlug = { slug: string; slugPadre?: string | null };

/** El segmento del tipo en la URL: su slug o, si cuelga de otro, `<slugPadre>/<slug>`. */
export function segmentoDeTipo(tipo: ConSlug): string {
  const padre = tipo.slugPadre?.trim();
  return padre ? `${padre}/${tipo.slug}` : tipo.slug;
}

/** Si el tipo cuelga de otro. */
export const esAnidado = (tipo: { slugPadre?: string | null }) => Boolean(tipo.slugPadre?.trim());

type Padre = { id: number; nombre: string; marca: unknown; tipoPadre?: unknown };

/**
 * Comprueba el padre elegido. Devuelve el mensaje de error o `null`.
 * - de la misma marca;
 * - no él mismo;
 * - de un solo nivel: el padre no puede colgar a su vez de otro;
 * - el slug del tipo no puede ser el de un modelo del padre (las dos URL serían la misma).
 */
export function comprobarPadre(args: {
  idTipo: number | null;
  slugTipo: string;
  marcaTipo: number | null;
  padre: Padre;
  marcaPadre: number | null;
  slugsDeModelosDelPadre: string[];
  tieneHijos: boolean;
}): string | null {
  const { idTipo, slugTipo, marcaTipo, padre, marcaPadre, slugsDeModelosDelPadre, tieneHijos } =
    args;
  if (idTipo !== null && padre.id === idTipo) return "Un tipo no puede colgar de sí mismo.";
  if (marcaTipo !== null && marcaPadre !== marcaTipo) {
    return `«${padre.nombre}» es de otra marca: elige un tipo de la misma marca.`;
  }
  if (padre.tipoPadre !== null && padre.tipoPadre !== undefined) {
    return `«${padre.nombre}» ya cuelga de otro tipo: solo se admite un nivel.`;
  }
  if (tieneHijos) return "De este tipo cuelgan otros: no puede colgar a su vez de otro.";
  if (slugTipo && slugsDeModelosDelPadre.includes(slugTipo)) {
    return `«${padre.nombre}» tiene un modelo con la misma dirección web que este tipo: cambia una de las dos.`;
  }
  return null;
}
