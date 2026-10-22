import type { Metadata } from "next";

import { IndiceBlog } from "@/components/blog/IndiceBlog";
import { cargarIndiceBlog, metadataIndiceBlog } from "@/lib/blog/listadoBlog";
import type { ParametrosURL } from "@/lib/filtros";

/**
 * Archivo de categoría del blog: `/category/{slug}/`, con la misma plantilla
 * que el índice (2026-10-21).
 *
 * El segmento `category` es el que genera WordPress. Se conserva tal cual
 * porque `/category/noticias/` está indexada y la jerarquía de URLs es
 * intocable (CLAUDE.md §3.3): no se redirige al índice filtrado, porque el
 * filtrado lleva `noindex` y se perdería lo indexado. Esta página SÍ se indexa,
 * con canónica propia.
 */
type Props = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<ParametrosURL>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria } = await params;
  return metadataIndiceBlog({ tipo: "categoria", slug: categoria }, 1, await searchParams);
}

export default async function CategoriaBlogPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const ambito = { tipo: "categoria", slug: categoria } as const;
  const datos = await cargarIndiceBlog(ambito, 1, await searchParams);
  if (datos.listado.tipo !== "listado") return null;
  return <IndiceBlog ambito={ambito} pagina={1} {...datos} listado={datos.listado} />;
}
