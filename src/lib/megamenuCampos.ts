/**
 * LOS CAMPOS QUE LEE EL MEGAMENÚ, por colección (2026-10-22). Una sola lista para las dos
 * puntas: la consulta del menú (`getMegamenu.ts`) pide exactamente estos campos, y el gancho
 * que refresca el menú de todo el sitio (`megamenuHooks.ts`) revalida cuando cambia alguno.
 * Antes eran dos listas a mano y se separaron: marcar «Tarjeta en el índice de tipos» cambiaba
 * el menú y el gancho no lo veía (el menú de las páginas que no son de nueva se quedaba viejo).
 *
 * Van también los campos de los FILTROS de la consulta (`mostrarEnWeb`), que deciden si una
 * fila sale, y los del orden: las claves del orden por arrastre de
 * `ordenArrastre.ts` (arrastrar en el panel refresca el menú). Desde el 2026-11-19 el menú ya no lee
 * el «Orden» numérico de tipos, categorías de usados ni líneas de lubricante. El `id` no: no cambia.
 * `ordenMarca` (repuestos) salió el 2026-11-25: oculto desde el #519 y sin uso en la web.
 * `megamenuCampos.test.ts` exige la clave de orden en cada colección ordenable de esta lista.
 */
export const CAMPOS_MENU = {
  "marcas-maquinaria": [
    "nombre",
    "slug",
    "logo",
    "logoOscuroEnMenu",
    "mostrarEnWeb",
    // Marca sin página propia: su entrada lleva fuera (LiuGong, 2026-11-03).
    "enlaceExterno",
    "_order",
  ],
  "tipos-maquinaria": [
    "nombre",
    "slug",
    "marca",
    "subtipos",
    "pestanaIndiceNueva",
    "_tipos-maquinaria_tipos_order",
  ],
  // `_order`: el orden arrastrando del panel (`orderable`, 2026-11-09).
  "categorias-maquinaria": ["nombre", "slug", "tiposIncluidos", "_order"],
  "categorias-usada": ["nombre", "slug", "enOtros", "mostrarEnWeb", "_order"],
  // Con su clave de orden (2026-11-25): sin ella, arrastrar en el panel no refrescaba el menú ni la
  // banda de marcas de la portada (caché del marco) hasta el siguiente despliegue.
  marcas: ["nombre", "slug", "logo", "logoOscuroEnMenu", "_order"],
  "tipos-equipo": ["nombre", "slug", "marca", "slugPadre", "_tipos-equipo_tipos_order"],
  // `padre`, `logo` y `colorMarca`: el botón de una página que cuelga de una categoría bajo su
  // baldosa (Filtros Donaldson bajo Filtración, 2026-10-26).
  "categorias-tecnicas": [
    "nombre",
    "slug",
    "imagen",
    "padre",
    "iconoMarca",
    "colorMarca",
    // El selector de marcas de lubricantes: a su página lleva una marca de «Otra web» sin
    // enlace (Dispel, 2026-11-05).
    "selectorMarcas",
    "_order",
  ],
  // «Otra web» con su enlace, y la bandera del país (Dispel y Eni, 2026-11-04).
  "marcas-lubricante": ["nombre", "slug", "destino", "enlaceExterno", "paisOrigen", "_order"],
  "categorias-lubricante": [
    "nombre",
    "slug",
    "marca",
    "enlaceMenu",
    "_categorias-lubricante_lineas_order",
  ],
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
