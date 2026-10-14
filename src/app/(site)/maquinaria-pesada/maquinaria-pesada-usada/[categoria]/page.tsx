import type { Metadata } from "next";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import type { ParametrosURL } from "@/lib/filtros";
import { cargarListadoCategoriaUsada, metadataListadoCategoriaUsada } from "@/lib/usados/listado";

/**
 * Categoría de maquinaria USADA: la página 1 de su listado, con filtros en la
 * query (`src/lib/usados/listado.ts`). Las siguientes viven en
 * `pagina/[pagina]` (src/lib/usados/paginacion.ts).
 *
 * DINÁMICA a propósito (decisión D3 de dirección, 2026-10-13): lee la query.
 * Los datos salen de la caché de datos, no de una consulta por visita.
 */
type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<ParametrosURL> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria } = await params;
  return metadataListadoCategoriaUsada(categoria, 1, await searchParams);
}

export default async function CategoriaUsadaPage({ params, searchParams }: Props) {
  const { categoria: slug } = await params;
  const { categoria, listado } = await cargarListadoCategoriaUsada(slug, 1, await searchParams);
  return <ListadoUsados categoria={categoria} pagina={1} listado={listado} />;
}
