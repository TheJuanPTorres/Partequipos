import type { CategoriasUsada, Media } from "@/payload-types";

import type { TarjetaMarca } from "../repuestos/marca";
import { imagenDeMedia } from "../utils/relations";
import { fotoMasReciente, textoUnidades, type UnidadDelIndice } from "./indice";
import { SIN_UNIDADES } from "./vacia";

/**
 * USADOS COMO EN WORDPRESS (cliente, 2026-10-19): en el menú y en el índice de
 * usados solo hay tres entradas de primer nivel, Excavadoras, Aditamentos y
 * «Otros», y la página «Otros» lista el resto de categorías. Qué va en cada
 * sitio lo decide la casilla «Agrupar en «Otros»» de cada categoría (marcada
 * por defecto: una categoría nueva va a «Otros»). Lógica pura; el acceso a
 * datos está en `lib/queries`.
 */

/** La entrada del menú, la tarjeta del índice y la miga. */
export const ETIQUETA_OTROS = "Otros";

/** El `<h1>` de la página «Otros» si el panel no pone otro. */
export const TITULO_OTROS = "Otra maquinaria pesada usada";

export const DESCRIPCION_OTROS =
  "Miniexcavadoras, bulldozers, motoniveladoras, cargadores y el resto de maquinaria pesada usada disponible, por categoría.";

type ConAgrupacion = Pick<CategoriasUsada, "nombre"> & {
  enOtros?: boolean | null;
  orden?: number | null;
};

/** Vacía (filas anteriores a la casilla) cuenta como marcada: va a «Otros». */
export const vaEnOtros = (c: { enOtros?: boolean | null }) => c.enOtros !== false;

/**
 * Las de primer nivel (casilla desmarcada), por «Orden en el primer nivel» y,
 * sin orden o empatadas, por nombre; y las agrupadas, en el orden recibido.
 */
export function separarCategorias<T extends ConAgrupacion>(
  categorias: readonly T[],
): { primerNivel: T[]; agrupadas: T[] } {
  const orden = (c: T) => (typeof c.orden === "number" ? c.orden : Number.POSITIVE_INFINITY);
  const primerNivel = categorias
    .filter((c) => !vaEnOtros(c))
    .sort((a, b) => orden(a) - orden(b) || a.nombre.localeCompare(b.nombre, "es"));
  return { primerNivel, agrupadas: categorias.filter(vaEnOtros) };
}

/**
 * La tarjeta «Otros» del índice: el total de unidades de las categorías
 * agrupadas (o «Sin unidades por ahora») y la foto elegida en el panel o, si
 * no hay, la de su unidad más reciente. Sin categorías agrupadas, ninguna: no
 * se enlaza una página vacía.
 */
export function tarjetaOtros(
  agrupadas: readonly Pick<CategoriasUsada, "id">[],
  unidades: UnidadDelIndice[],
  imagen: number | Media | null | undefined,
  href: string,
): TarjetaMarca | null {
  if (agrupadas.length === 0) return null;
  const ids = new Set(agrupadas.map((c) => c.id));
  const suyas = unidades.filter((u) => ids.has(u.categoria));
  return {
    clave: "categoria-otros",
    titulo: ETIQUETA_OTROS,
    href,
    imagen: imagenDeMedia(imagen, "") ?? fotoMasReciente(suyas),
    soloEscritorio: false,
    detalle: suyas.length ? textoUnidades(suyas.length) : SIN_UNIDADES,
  };
}
