/**
 * LOS CAMPOS QUE LEE EL MEGAMENÚ, por colección (2026-10-22). Una sola lista para las dos
 * puntas: la consulta del menú (`getMegamenu.ts`) pide exactamente estos campos, y el gancho
 * que refresca el menú de todo el sitio (`megamenuHooks.ts`) revalida cuando cambia alguno.
 * Antes eran dos listas a mano y se separaron: marcar «Tarjeta en el índice de tipos» cambiaba
 * el menú y el gancho no lo veía (el menú de las páginas que no son de nueva se quedaba viejo).
 *
 * Van también los campos de los FILTROS de la consulta (`mostrarEnWeb`), que deciden si una
 * fila sale, y los del orden (`orden`, `ordenMarca`). El `id` no: no cambia.
 */
export const CAMPOS_MENU = {
  "marcas-maquinaria": ["nombre", "slug", "logo", "logoOscuroEnMenu", "mostrarEnWeb"],
  "tipos-maquinaria": ["nombre", "slug", "marca", "subtipos", "pestanaIndiceNueva", "orden"],
  "categorias-maquinaria": ["nombre", "slug", "tiposIncluidos"],
  "categorias-usada": ["nombre", "slug", "enOtros", "orden", "mostrarEnWeb"],
  marcas: ["nombre", "slug", "logo", "logoOscuroEnMenu"],
  "tipos-equipo": ["nombre", "slug", "marca", "slugPadre"],
  // `padre`, `logo` y `colorMarca`: el botón de una página que cuelga de una categoría bajo su
  // baldosa (Filtros Donaldson bajo Filtración, 2026-10-26).
  "categorias-tecnicas": [
    "nombre",
    "slug",
    "ordenMarca",
    "imagen",
    "padre",
    "iconoMarca",
    "colorMarca",
  ],
  "marcas-lubricante": ["nombre", "slug"],
  "categorias-lubricante": ["nombre", "slug", "marca", "enlaceMenu", "orden"],
} as const;

export type ColeccionDelMenu = keyof typeof CAMPOS_MENU;

/** Los campos que la consulta del menú no filtra (los de `where`): no hace falta pedirlos. */
const SOLO_FILTRO = new Set(["mostrarEnWeb"]);

/** El `select` de la consulta del menú para una colección: sus campos, salvo los de filtro. */
export function selectDelMenu<C extends ColeccionDelMenu>(
  coleccion: C,
): Record<Exclude<(typeof CAMPOS_MENU)[C][number], "mostrarEnWeb">, true> {
  return Object.fromEntries(
    CAMPOS_MENU[coleccion].filter((c) => !SOLO_FILTRO.has(c)).map((c) => [c, true]),
  ) as Record<Exclude<(typeof CAMPOS_MENU)[C][number], "mostrarEnWeb">, true>;
}
