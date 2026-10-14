import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import type { ParametrosURL } from "@/lib/filtros";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { cargarListadoUsado, metadataListadoUsado, redirigirPaginaUno } from "@/lib/usados/listado";
import { numeroDePagina } from "@/lib/usados/paginacion";

/** Páginas 2 en adelante del listado de una marca de usada, con sus filtros. */
type Props = {
  params: Promise<{ marca: string; pagina: string }>;
  searchParams: Promise<ParametrosURL>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { marca, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataListadoUsado("marca", marca, pagina, await searchParams);
}

export default async function PaginaMarcaUsada({ params, searchParams }: Props) {
  const { marca, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null) notFound();
  const parametros = await searchParams;
  if (pagina === 1) redirigirPaginaUno("marca", marca, parametros);
  const { ambito, listado } = await cargarListadoUsado("marca", marca, pagina, parametros);
  return <ListadoUsados ambito={ambito} pagina={pagina} listado={listado} />;
}
