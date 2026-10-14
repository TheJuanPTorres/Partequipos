import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListadoNueva } from "@/components/nueva/ListadoNueva";
import type { ParametrosURL } from "@/lib/filtros";
import {
  cargarListadoNueva,
  metadataListadoNueva,
  redirigirPaginaUnoNueva,
} from "@/lib/nueva/listado";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { numeroDePagina } from "@/lib/usados/paginacion";

/** Páginas 2 en adelante de una categoría de nueva, con los mismos filtros que la 1. */
type Props = {
  params: Promise<{ categoria: string; pagina: string }>;
  searchParams: Promise<ParametrosURL>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataListadoNueva("categoria", categoria, pagina, await searchParams);
}

export default async function PaginaCategoriaNueva({ params, searchParams }: Props) {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null) notFound();
  const parametros = await searchParams;
  if (pagina === 1) redirigirPaginaUnoNueva("categoria", categoria, parametros);
  const { ambito, listado } = await cargarListadoNueva("categoria", categoria, pagina, parametros);
  return <ListadoNueva ambito={ambito} pagina={pagina} listado={listado} />;
}
