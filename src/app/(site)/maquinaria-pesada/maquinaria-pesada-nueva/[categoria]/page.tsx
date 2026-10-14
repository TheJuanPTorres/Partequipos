import type { Metadata } from "next";

import { ListadoNueva } from "@/components/nueva/ListadoNueva";
import type { ParametrosURL } from "@/lib/filtros";
import { cargarListadoNueva, metadataListadoNueva } from "@/lib/nueva/listado";

/**
 * Categoría transversal de la línea nueva (`/…/nueva/excavadoras/`) con la
 * plantilla «Categoría secundaria» de ux-9: los equipos de los tipos que
 * declara (`tiposIncluidos`), de todas las marcas, con filtros
 * (`src/lib/nueva/listado.ts`). Las páginas siguientes viven en
 * `pagina/[pagina]`.
 *
 * DINÁMICA a propósito (lee la query), con los datos en la caché de datos.
 */
type Props = { params: Promise<{ categoria: string }>; searchParams: Promise<ParametrosURL> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria } = await params;
  return metadataListadoNueva("categoria", categoria, 1, await searchParams);
}

export default async function CategoriaNuevaPage({ params, searchParams }: Props) {
  const { categoria } = await params;
  const { ambito, listado } = await cargarListadoNueva(
    "categoria",
    categoria,
    1,
    await searchParams,
  );
  return <ListadoNueva ambito={ambito} pagina={1} listado={listado} />;
}
