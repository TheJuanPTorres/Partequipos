import type { Metadata } from "next";

import { IndiceBlog } from "@/components/blog/IndiceBlog";
import { cargarIndiceBlog, metadataIndiceBlog } from "@/lib/blog/listadoBlog";
import type { ParametrosURL } from "@/lib/filtros";

/**
 * Índice del blog: `/noticias/`, con la plantilla «Blog» de Andrés (2026-10-21).
 *
 * Es una de las TRES puertas de entrada al mismo contenido que tiene el sitio
 * actual, junto a `/blog-partequipos/` (que ya da 301 aquí) y
 * `/category/noticias/`. De las tres, esta es la que tiene meta description
 * propia y redactada: es la canónica (ADR 0008, CLAUDE.md §10.3).
 *
 * Dinámica, como los listados de usados: lee la query de la URL (categorías y
 * búsqueda). Los datos van en la caché de datos `datos:blog`. Las páginas 2 en
 * adelante están en `pagina/<n>/`.
 */
type Props = { searchParams: Promise<ParametrosURL> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadataIndiceBlog({ tipo: "indice" }, 1, await searchParams);
}

export default async function BlogIndicePage({ searchParams }: Props) {
  const ambito = { tipo: "indice" } as const;
  const datos = await cargarIndiceBlog(ambito, 1, await searchParams);
  if (datos.listado.tipo !== "listado") return null;
  return <IndiceBlog ambito={ambito} pagina={1} {...datos} listado={datos.listado} />;
}
