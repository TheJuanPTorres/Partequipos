import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import { conConsulta, consultaRecibida, otrosParametros, type ParametrosURL } from "@/lib/filtros";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { CATALOGO_USADOS } from "@/lib/usados/filtros";
import {
  cargarListadoCategoriaUsada,
  metadataListadoCategoriaUsada,
  rutaDePaginaUsada,
} from "@/lib/usados/listado";
import { numeroDePagina } from "@/lib/usados/paginacion";

/**
 * Páginas 2 en adelante del listado de una categoría de usada
 * (src/lib/usados/paginacion.ts), con los mismos filtros que la página 1.
 * Dinámicas, como la página 1 (`../../page.tsx`).
 */
type Props = {
  params: Promise<{ categoria: string; pagina: string }>;
  searchParams: Promise<ParametrosURL>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataListadoCategoriaUsada(categoria, pagina, await searchParams);
}

export default async function PaginaCategoriaUsada({ params, searchParams }: Props) {
  const { categoria: slug, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null) notFound();
  const parametros = await searchParams;
  // La página 1 tiene una sola URL: la de la categoría (con su barra final y
  // los parámetros que traiga, en un solo salto).
  if (pagina === 1) {
    permanentRedirect(
      conConsulta(
        rutaDePaginaUsada(slug, 1),
        consultaRecibida(parametros, CATALOGO_USADOS),
        otrosParametros(parametros, CATALOGO_USADOS),
      ),
    );
  }
  const { categoria, listado } = await cargarListadoCategoriaUsada(slug, pagina, parametros);
  return <ListadoUsados categoria={categoria} pagina={pagina} listado={listado} />;
}
