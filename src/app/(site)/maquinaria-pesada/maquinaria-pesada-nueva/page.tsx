import type { Metadata } from "next";

import { ListadoNueva } from "@/components/nueva/ListadoNueva";
import type { ParametrosURL } from "@/lib/filtros";
import { cargarListadoNueva, metadataListadoNueva } from "@/lib/nueva/listado";

/**
 * Índice de maquinaria NUEVA con la plantilla «Categoría secundaria» de ux-9
 * (decisión de dirección, 2026-10-14): todos los equipos, con pestañas por
 * categoría y los filtros del módulo común (`src/lib/nueva/listado.ts`). Las
 * páginas siguientes viven en `pagina/[pagina]`.
 *
 * DINÁMICO a propósito, como los listados de usados: lee la query. Los datos
 * salen de la caché de datos (`datos:nueva`), no de una consulta por visita.
 */
type Props = { searchParams: Promise<ParametrosURL> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return metadataListadoNueva("indice", null, 1, await searchParams);
}

export default async function NuevaIndexPage({ searchParams }: Props) {
  const { ambito, listado } = await cargarListadoNueva("indice", null, 1, await searchParams);
  return <ListadoNueva ambito={ambito} pagina={1} listado={listado} />;
}
