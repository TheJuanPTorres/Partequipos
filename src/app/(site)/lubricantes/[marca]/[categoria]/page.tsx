import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategoriaLubricantePorSlug,
  getCategoriasLubricante,
  getMarcaLubricantePorSlug,
} from "@/lib/queries/getLubricantes";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { MarcasLubricante } from "@/payload-types";

/** Categoría de aplicación: `/lubricantes/{marca}/{categoria}/`. */
type Params = { marca: string; categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasLubricante();

  return categorias.flatMap((categoria) => {
    const marca = poblado<MarcasLubricante>(categoria.marca);
    if (!marca) return [];
    return [{ marca: marca.slug, categoria: categoria.slug }];
  });
}

/**
 * Resuelve la cadena validando coherencia: la categoría debe pertenecer a la
 * marca de la URL. Una combinación cruzada devuelve null y acaba en 404, no en
 * una página que muestre la categoría de otra marca.
 */
async function resolver(params: Params) {
  const marca = await getMarcaLubricantePorSlug(params.marca);
  if (!marca) return null;

  const categoria = await getCategoriaLubricantePorSlug(marca.id, params.categoria);
  if (!categoria) return null;

  return { marca, categoria };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return {};

  const { marca, categoria } = data;

  return buildMetadata({
    nombre: `${categoria.nombre} | Lubricantes ${marca.nombre}`,
    path: rutas.categoriaLubricante(marca.slug, categoria.slug),
    descripcion: categoria.entradilla,
    seo: categoria.seo,
    imageUrl: imagenDeMedia(categoria.imagen, categoria.nombre)?.url,
  });
}

export default async function CategoriaLubricantePage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, categoria } = data;

  const imagen = imagenDeMedia(categoria.imagen, categoria.nombre);
  const productos = (categoria.productos ?? []).filter((p) => p.nombre?.trim());

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: `Lubricantes ${marca.nombre}`, path: rutas.marcaLubricante(marca.slug) },
    { nombre: categoria.nombre, path: rutas.categoriaLubricante(marca.slug, categoria.slug) },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      {/*
       * Un solo h1, e incluye la marca. En el sitio actual estas 5 páginas no
       * tienen NINGÚN h1 (medido en el rastreo), así que esto además corrige
       * un defecto de SEO heredado.
       */}
      <h1 className="text-3xl font-semibold text-gray-900">
        {categoria.nombre} · Lubricantes {marca.nombre}
      </h1>

      {categoria.entradilla ? (
        <p className="mt-3 max-w-2xl text-gray-600">{categoria.entradilla}</p>
      ) : null}

      {imagen ? (
        <Image
          src={imagen.url}
          alt={imagen.alt}
          width={imagen.width}
          height={imagen.height}
          className="mt-6 h-auto w-full max-w-md object-contain"
        />
      ) : null}

      {categoria.descripcion ? (
        <div className="mt-6">
          <RichText data={categoria.descripcion} />
        </div>
      ) : null}

      {/*
       * Las líneas de producto solo aparecen si el editor las cargó. En los
       * datos de demostración están vacías a propósito: no tenemos el catálogo
       * real y no se inventan especificaciones de un lubricante que existe.
       */}
      {productos.length > 0 ? (
        <section className="mt-10" aria-labelledby="productos-heading">
          <h2 id="productos-heading" className="text-xl font-medium text-gray-900">
            Líneas de producto
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {productos.map((producto) => (
              <li
                key={producto.id ?? producto.nombre}
                className="rounded-lg border border-gray-200 p-4"
              >
                <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                {producto.descripcion ? (
                  <p className="mt-1 text-sm text-gray-700">{producto.descripcion}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav
        className="mt-10 border-t border-gray-200 pt-6 text-sm"
        aria-label="Navegación de lubricantes"
      >
        <Link href={`${rutas.marcaLubricante(marca.slug)}/`} className="underline">
          ← Ver todas las líneas de Lubricantes {marca.nombre}
        </Link>
      </nav>
    </main>
  );
}
