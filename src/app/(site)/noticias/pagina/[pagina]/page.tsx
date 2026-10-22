import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IndiceBlog } from "@/components/blog/IndiceBlog";
import {
  cargarIndiceBlog,
  metadataIndiceBlog,
  redirigirPaginaUnoBlog,
} from "@/lib/blog/listadoBlog";
import type { ParametrosURL } from "@/lib/filtros";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { numeroDePagina } from "@/lib/usados/paginacion";

/** Páginas 2 en adelante del índice del blog (`/noticias/pagina/<n>/`). `…/pagina/1/` redirige. */
type Props = {
  params: Promise<{ pagina: string }>;
  searchParams: Promise<ParametrosURL>;
};

const ambito = { tipo: "indice" } as const;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const pagina = numeroDePagina((await params).pagina);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataIndiceBlog(ambito, pagina, await searchParams);
}

export default async function BlogIndicePaginaPage({ params, searchParams }: Props) {
  const pagina = numeroDePagina((await params).pagina);
  if (pagina === null) notFound();
  const parametros = await searchParams;
  if (pagina === 1) redirigirPaginaUnoBlog(ambito, parametros);
  const datos = await cargarIndiceBlog(ambito, pagina, parametros);
  if (datos.listado.tipo !== "listado") return null;
  return <IndiceBlog ambito={ambito} pagina={pagina} {...datos} listado={datos.listado} />;
}
