import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ListadoUsados } from "@/components/catalog/ListadoUsados";
import {
  getCategoriaUsadaPorSlug,
  getEquiposUsadosDeCategoria,
  getPaginasDeUsados,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { numeroDePagina } from "@/lib/usados/paginacion";

/**
 * Páginas 2 en adelante del listado de una categoría de usada
 * (src/lib/usados/paginacion.ts). Estáticas; una página que aparezca después
 * del build (entran unidades) se genera a la primera visita y la revalidan los
 * ganchos de `equipos-usados`.
 */
type Params = { categoria: string; pagina: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getPaginasDeUsados();
  return categorias.flatMap(({ slug, paginas }) =>
    Array.from({ length: paginas - 1 }, (_, i) => ({ categoria: slug, pagina: String(i + 2) })),
  );
}

async function resolver(params: Promise<Params>) {
  const { categoria: slug, pagina: segmento } = await params;
  const pagina = numeroDePagina(segmento);
  if (pagina === null) return null;
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) return null;
  return { categoria, pagina };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = await resolver(params);
  if (!r || r.pagina === 1) return METADATA_404;
  const { categoria, pagina } = r;

  // Título y descripción propios de cada página: sin «página n», Google vería
  // varias URL con el mismo título. La canónica es la de la propia página.
  const base =
    categoria.seo?.metaTitle?.trim() || tituloPorDefecto.categoriaUsada(categoria.nombre);
  const descripcion = categoria.seo?.metaDescription?.trim() || categoria.descripcion;
  return metadataDe({
    nombre: `${base} · página ${pagina}`,
    path: rutas.categoriaUsadaPagina(categoria.slug, pagina),
    descripcion: descripcion ? `Página ${pagina}. ${descripcion}` : null,
    seo: { ...categoria.seo, metaTitle: null, metaDescription: null },
  });
}

export default async function PaginaCategoriaUsada({ params }: { params: Promise<Params> }) {
  const r = await resolver(params);
  if (!r) notFound();
  const { categoria, pagina } = r;
  // La página 1 tiene una sola URL: la de la categoría.
  // Con la barra final: sin ella, `trailingSlash` añadiría un segundo salto.
  if (pagina === 1) permanentRedirect(`${rutas.categoriaUsada(categoria.slug)}/`);

  const datos = await getEquiposUsadosDeCategoria(categoria.id, pagina);
  if (pagina > datos.paginas) notFound();
  return <ListadoUsados categoria={categoria} pagina={pagina} datos={datos} />;
}
