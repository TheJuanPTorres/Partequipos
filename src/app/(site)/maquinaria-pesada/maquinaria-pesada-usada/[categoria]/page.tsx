import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import {
  getCategoriaUsadaPorSlug,
  getCategoriasUsada,
  getEquiposUsadosDeCategoria,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

/**
 * Categoría de maquinaria USADA: la página 1 de su listado. Las siguientes
 * viven en `pagina/[pagina]` (src/lib/usados/paginacion.ts).
 */
type Params = { categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasUsada();
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.categoriaUsada(categoria.nombre),
    path: rutas.categoriaUsada(categoria.slug),
    descripcion: categoria.descripcion,
    seo: categoria.seo,
  });
}

export default async function CategoriaUsadaPage({ params }: { params: Promise<Params> }) {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) notFound();

  const datos = await getEquiposUsadosDeCategoria(categoria.id, 1);
  return <ListadoUsados categoria={categoria} pagina={1} datos={datos} />;
}
