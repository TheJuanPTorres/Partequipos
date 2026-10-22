import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import type { ParametrosURL } from "@/lib/filtros";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { cargarListadoUsado, metadataListadoUsado, redirigirPaginaUno } from "@/lib/usados/listado";
import { numeroDePagina } from "@/lib/usados/paginacion";

/**
 * Páginas 2 en adelante del listado de una categoría de usada
 * (src/lib/usados/paginacion.ts), con los mismos filtros que la página 1.
 * Dinámicas, como la página 1 (`../../page.tsx`).
 */
type Props = {
  params: Promise<{ categoria: string; pagina: string }>;
  searchParams: Promise<ParametrosURL>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null || pagina === 1) return METADATA_404;
  return metadataListadoUsado("categoria", categoria, pagina, await searchParams);
}

export default async function PaginaCategoriaUsada({ params, searchParams }: Props) {
  const { categoria, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null) notFound();
  const parametros = await searchParams;
  if (pagina === 1) redirigirPaginaUno("categoria", categoria, parametros);
  const { ambito, listado, vacio, aviso, animaciones } = await cargarListadoUsado(
    "categoria",
    categoria,
    pagina,
    parametros,
  );
  return (
    <ListadoUsados
      ambito={ambito}
      pagina={pagina}
      listado={listado}
      vacio={vacio}
      aviso={aviso}
      animaciones={animaciones}
    />
  );
}
