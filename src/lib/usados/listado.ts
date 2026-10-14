import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  depurar,
  hayFiltros,
  leerSeleccion,
  metadataFiltrada,
  metadataSinIndexar,
  resolverListado,
  type ParametrosURL,
} from "../filtros";
import { getCategoriaUsadaPorSlug, getUnidadesDeCategoriaUsada } from "../queries/getMaquinaria";
import { rutas } from "../routes";
import { absoluteUrl, indexacionPermitida } from "../seo/config";
import { metadataDe } from "../seo/metadata";
import { METADATA_404 } from "../seo/noEncontrada";
import { tituloPorDefecto } from "../seo/porDefecto";
import { CATALOGO_USADOS } from "./filtros";
import { categoriaUsadaIndexable } from "./heredadas";
import { POR_PAGINA } from "./paginacion";

/**
 * El listado de una categoría de USADA con filtros, para sus dos rutas: la
 * página 1 (la URL de la categoría) y `…/pagina/<n>/`.
 *
 * Las dos son DINÁMICAS (leen la query de la URL; decisión D3 de dirección,
 * 2026-10-13) y sus datos salen de la caché de datos
 * (`getUnidadesDeCategoriaUsada`).
 */

/** La URL de la página `pagina` de la categoría, con su barra final. */
export function rutaDePaginaUsada(slug: string, pagina: number): string {
  return `${rutas.categoriaUsadaPagina(slug, pagina)}/`;
}

/**
 * Lo que pinta la página: la categoría y el listado resuelto. Redirige (308)
 * si la query no está en su forma canónica, y da 404 si la categoría no
 * existe o esa página no existe con esa selección.
 */
export async function cargarListadoCategoriaUsada(
  slug: string,
  pagina: number,
  parametros: ParametrosURL,
) {
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) notFound();
  const items = await getUnidadesDeCategoriaUsada(categoria.id);
  const listado = resolverListado({
    items,
    parametros,
    catalogo: CATALOGO_USADOS,
    pagina,
    porPagina: POR_PAGINA,
    ruta: rutaDePaginaUsada(slug, pagina),
  });
  if (listado.tipo === "redirigir") permanentRedirect(listado.destino);
  if (listado.tipo === "no-existe") notFound();
  return { categoria, listado };
}

/**
 * La metadata de una página del listado:
 * - página 1 sin filtros: la de siempre de la categoría;
 * - página n sin filtros: título y descripción con «página n», canónica propia;
 * - con filtros u otro orden: no se indexa, y la canónica es la página 1 sin
 *   filtros (`metadataFiltrada`);
 * - una categoría creada en el panel y sin unidades: no se indexa (D4).
 */
export async function metadataListadoCategoriaUsada(
  slug: string,
  pagina: number,
  parametros: ParametrosURL,
): Promise<Metadata> {
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) return METADATA_404;
  const items = await getUnidadesDeCategoriaUsada(categoria.id);

  const titulo = tituloPorDefecto.categoriaUsada(categoria.nombre);
  const base =
    pagina === 1
      ? await metadataDe({
          nombre: titulo,
          path: rutas.categoriaUsada(categoria.slug),
          descripcion: categoria.descripcion,
          seo: categoria.seo,
        })
      : await metadataDePaginaN(categoria, titulo, pagina);

  const seleccion = depurar(leerSeleccion(parametros, CATALOGO_USADOS), CATALOGO_USADOS, items);
  if (hayFiltros(seleccion, CATALOGO_USADOS)) {
    return metadataFiltrada(
      base,
      absoluteUrl(rutas.categoriaUsada(categoria.slug)),
      indexacionPermitida(),
    );
  }
  if (!categoriaUsadaIndexable(categoria.slug, items.length)) {
    return metadataSinIndexar(base, indexacionPermitida());
  }
  return base;
}

/**
 * Título y descripción propios de cada página: sin «página n», Google vería
 * varias URL con el mismo título. La canónica es la de la propia página.
 */
function metadataDePaginaN(
  categoria: NonNullable<Awaited<ReturnType<typeof getCategoriaUsadaPorSlug>>>,
  titulo: string,
  pagina: number,
): Promise<Metadata> {
  const base = categoria.seo?.metaTitle?.trim() || titulo;
  const descripcion = categoria.seo?.metaDescription?.trim() || categoria.descripcion;
  return metadataDe({
    nombre: `${base} · página ${pagina}`,
    path: rutas.categoriaUsadaPagina(categoria.slug, pagina),
    descripcion: descripcion ? `Página ${pagina}. ${descripcion}` : null,
    seo: { ...categoria.seo, metaTitle: null, metaDescription: null },
  });
}
