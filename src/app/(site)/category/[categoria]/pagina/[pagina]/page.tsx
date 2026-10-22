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

/** Páginas 2 en adelante de un archivo de categoría (`/category/<slug>/pagina/<n>/`). */
type Props = {
  params: Promise<{ categoria: string; pagina: string }>;
  searchParams: Promise<ParametrosURL>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataIndiceBlog({ tipo: "categoria", slug: categoria }, pagina, await searchParams);
}

export default async function CategoriaBlogPaginaPage({ params, searchParams }: Props) {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null) notFound();
  const ambito = { tipo: "categoria", slug: categoria } as const;
  const parametros = await searchParams;
  if (pagina === 1) redirigirPaginaUnoBlog(ambito, parametros);
  const datos = await cargarIndiceBlog(ambito, pagina, parametros);
  if (datos.listado.tipo !== "listado") return null;
  return <IndiceBlog ambito={ambito} pagina={pagina} {...datos} listado={datos.listado} />;
}
