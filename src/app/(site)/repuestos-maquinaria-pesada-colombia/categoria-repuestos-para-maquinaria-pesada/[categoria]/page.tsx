import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CierreRepuestos } from "@/components/repuestos/CierreRepuestos";
import { HeroMarca } from "@/components/repuestos/HeroMarca";
import { PlacasMarcas } from "@/components/repuestos/PlacasMarcas";
import { QueIncluye } from "@/components/repuestos/QueIncluye";
import estilos from "@/components/repuestos/marca.module.css";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategoriaRepuestosPorSlug,
  getCategoriasRepuestos,
} from "@/lib/queries/getCategoriasRepuestos";
import { getMarcas } from "@/lib/queries/getMarcas";
import { getRepuestosMarca } from "@/lib/queries/getRepuestosMarca";
import {
  fondoDeRespaldo,
  placasDeMarcas,
  vistaEncabezadoCategoria,
} from "@/lib/repuestos/categoria";
import { gruposDeCategoria } from "@/lib/repuestos/grupos";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { imagenDeMedia } from "@/lib/utils/relations";

type Params = { categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasRepuestos();
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaRepuestosPorSlug(slug);
  if (!categoria) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.categoriaRepuestos(categoria.nombre),
    path: rutas.categoriaRepuestos(categoria.slug),
    descripcion: categoria.descripcion,
    seo: categoria.seo,
    imageUrl: imagenDeMedia(categoria.imagen, categoria.nombre)?.url,
  });
}

const ANCLA = "marcas-repuestos";

/**
 * PÁGINA DE CATEGORÍA TÉCNICA DE REPUESTOS — PROVISIONAL hasta el diseño de
 * Andrés (docs/diseno/decisiones-repuestos-marca.md §7): encabezado con el
 * nombre, la descripción y la imagen de la categoría, las marcas con las que
 * trabajamos, «Qué incluye» (los grupos de productos, si los tiene), contacto y
 * testimonios. La URL es la del sitio actual.
 */
export default async function CategoriaRepuestosPage({ params }: { params: Promise<Params> }) {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaRepuestosPorSlug(slug);
  if (!categoria) notFound();

  const [global, marcas] = await Promise.all([getRepuestosMarca(), getMarcas()]);
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Categorías", path: rutas.categoriasRepuestos() },
    { nombre: categoria.nombre, path: rutas.categoriaRepuestos(categoria.slug) },
  ];

  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <div className={estilos.migas}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <HeroMarca
        vista={vistaEncabezadoCategoria(categoria, global, fondoDeRespaldo(marcas))}
        anclaSiguiente={ANCLA}
      />

      <PlacasMarcas
        id={ANCLA}
        titulo="Marcas con las que trabajamos"
        marcas={placasDeMarcas(marcas)}
      />

      <QueIncluye
        id="que-incluye"
        titulo={`Qué incluye ${categoria.nombre.toLowerCase()}`}
        grupos={gruposDeCategoria(categoria)}
      />

      <CierreRepuestos
        origen={rutas.categoriaRepuestos(categoria.slug)}
        sobre={categoria.nombre.toLowerCase()}
      />
    </main>
  );
}
