import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getMarcaMaquinariaPorSlug,
  getMarcasMaquinaria,
  getTiposDeMarcaMaquinaria,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

type Params = { marca: string };

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcasMaquinaria();
  return marcas.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: slug } = await params;
  const marca = await getMarcaMaquinariaPorSlug(slug);
  if (!marca) return {};

  return buildMetadata({
    nombre: `Maquinaria pesada ${marca.nombre}`,
    path: rutas.marcaMaquinaria(marca.slug),
    descripcion: marca.descripcion,
    seo: marca.seo,
    imageUrl: imagenDeMedia(marca.logo, marca.nombre)?.url,
  });
}

export default async function MarcaMaquinariaPage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaMaquinariaPorSlug(slug);
  if (!marca) notFound();

  const tipos = await getTiposDeMarcaMaquinaria(marca.id);
  const logo = imagenDeMedia(marca.logo, `Logo de ${marca.nombre}`);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
    { nombre: marca.nombre, path: rutas.marcaMaquinaria(marca.slug) },
  ];

  const items = tipos.map((tipo) => ({
    href: `${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`,
    titulo: tipo.nombre,
    descripcion: tipo.descripcion,
    imagen: null,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex items-center gap-4">
        {logo ? (
          <Image
            src={logo.url}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            className="h-14 w-auto object-contain"
            priority
          />
        ) : null}
        <h1 className="text-3xl font-semibold text-gray-900">Maquinaria pesada {marca.nombre}</h1>
      </div>

      {marca.descripcion ? (
        <p className="mt-3 max-w-2xl text-gray-600">{marca.descripcion}</p>
      ) : null}

      <section className="mt-8" aria-labelledby="tipos-heading">
        <h2 id="tipos-heading" className="text-xl font-medium text-gray-900">
          Tipos de equipo {marca.nombre}
        </h2>
        <div className="mt-4">
          <ListaEnlaces
            items={items}
            vacio={`Todavía no hay tipos de equipo publicados para ${marca.nombre}.`}
          />
        </div>
      </section>
    </main>
  );
}
