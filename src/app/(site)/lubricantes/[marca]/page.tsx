import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { RichText } from "@/components/layout/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategoriasDeMarcaLubricante,
  getMarcaLubricantePorSlug,
  getMarcasLubricante,
} from "@/lib/queries/getLubricantes";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

/**
 * Marca de lubricantes: `/lubricantes/{marca}/`.
 *
 * Es la raíz de la sección. NO hay índice en `/lubricantes/`: el rastreo no
 * encuentra esa página, así que ese path responde 404 igual que hoy.
 */
type Params = { marca: string };

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcasLubricante();
  return marcas.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) return {};

  return buildMetadata({
    nombre: `Lubricantes ${marca.nombre}`,
    path: rutas.marcaLubricante(marca.slug),
    descripcion: marca.entradilla,
    seo: marca.seo,
    imageUrl: imagenDeMedia(marca.logo, marca.nombre)?.url,
  });
}

export default async function MarcaLubricantePage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) notFound();

  const categorias = await getCategoriasDeMarcaLubricante(marca.id);
  const logo = imagenDeMedia(marca.logo, marca.nombre);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: `Lubricantes ${marca.nombre}`, path: rutas.marcaLubricante(marca.slug) },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">Lubricantes {marca.nombre}</h1>

      {marca.entradilla ? <p className="mt-3 max-w-2xl text-gray-600">{marca.entradilla}</p> : null}

      {logo ? (
        <Image
          src={logo.url}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          className="mt-6 h-20 w-auto object-contain"
        />
      ) : null}

      {marca.descripcion ? (
        <div className="mt-6">
          <RichText data={marca.descripcion} />
        </div>
      ) : null}

      <section className="mt-10" aria-labelledby="categorias-heading">
        <h2 id="categorias-heading" className="text-xl font-medium text-gray-900">
          {categorias.length} {categorias.length === 1 ? "línea disponible" : "líneas disponibles"}
        </h2>

        <div className="mt-4">
          <ListaEnlaces
            vacio={`Todavía no hay líneas publicadas para ${marca.nombre}.`}
            items={categorias.map((categoria) => ({
              href: `${rutas.categoriaLubricante(marca.slug, categoria.slug)}/`,
              titulo: categoria.nombre,
              descripcion: categoria.entradilla,
              imagen: imagenDeMedia(categoria.imagen, categoria.nombre),
            }))}
          />
        </div>
      </section>
    </main>
  );
}
