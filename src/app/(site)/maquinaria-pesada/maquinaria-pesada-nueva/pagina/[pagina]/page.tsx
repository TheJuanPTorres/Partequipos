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

/** Páginas 2 en adelante del índice de nueva, con los mismos filtros que la 1. */
type Props = { params: Promise<{ pagina: string }>; searchParams: Promise<ParametrosURL> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const pagina = numeroDePagina((await params).pagina);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataListadoNueva("indice", null, pagina, await searchParams);
}

export default async function PaginaNueva({ params, searchParams }: Props) {
  const pagina = numeroDePagina((await params).pagina);
  if (pagina === null) notFound();
  const parametros = await searchParams;
  if (pagina === 1) redirigirPaginaUnoNueva("indice", null, parametros);
  const { ambito, listado } = await cargarListadoNueva("indice", null, pagina, parametros);
  return <ListadoNueva ambito={ambito} pagina={pagina} listado={listado} />;
}
