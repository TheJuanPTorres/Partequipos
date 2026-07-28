import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarcaPorSlug } from "@/lib/queries/getMarcas";
import { getModelosDeTipo } from "@/lib/queries/getModelos";
import { getTipoPorSlug, getTipos } from "@/lib/queries/getTipos";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { Marca } from "@/payload-types";

type Params = { marca: string; tipo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const tipos = await getTipos();

  return tipos.flatMap((tipo) => {
    const marca = poblado<Marca>(tipo.marca);
    // Sin marca poblada no se puede construir la ruta: se omite.
    return marca ? [{ marca: marca.slug, tipo: tipo.slug }] : [];
  });
}

/**
 * Resuelve marca + tipo validando que el tipo pertenezca REALMENTE a la marca
 * del path. Devuelve null ante cualquier combinación incoherente.
 */
async function resolver(params: Params) {
  const marca = await getMarcaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  return { marca, tipo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return {};

  const { marca, tipo } = data;
  return buildMetadata({
    nombre: `Repuestos para ${tipo.nombre.toLowerCase()} ${marca.nombre}`,
    path: rutas.tipo(marca.slug, tipo.slug),
    descripcion: tipo.descripcion,
    seo: tipo.seo,
  });
}

export default async function TipoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();

  const { marca, tipo } = data;
  const modelos = await getModelosDeTipo(tipo.id);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
    { nombre: marca.nombre, path: rutas.marca(marca.slug) },
    { nombre: tipo.nombre, path: rutas.tipo(marca.slug, tipo.slug) },
  ];

  const items = modelos.map((modelo) => {
    const primeraImagen = Array.isArray(modelo.imagenes) ? modelo.imagenes[0] : null;
    return {
      href: rutas.modelo(marca.slug, tipo.slug, modelo.slug),
      titulo: modelo.nombre,
      descripcion: modelo.codigo ? `Código ${modelo.codigo}` : null,
      imagen: imagenDeMedia(primeraImagen, modelo.nombre),
    };
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">
        Repuestos para {tipo.nombre.toLowerCase()} {marca.nombre}
      </h1>

      {tipo.descripcion ? <p className="mt-3 max-w-2xl text-gray-600">{tipo.descripcion}</p> : null}

      <section className="mt-8" aria-labelledby="modelos-heading">
        <h2 id="modelos-heading" className="text-xl font-medium text-gray-900">
          Modelos de {tipo.nombre.toLowerCase()} {marca.nombre}
        </h2>
        <div className="mt-4">
          <ListaEnlaces
            items={items}
            vacio={`Todavía no hay modelos publicados para ${tipo.nombre.toLowerCase()} ${marca.nombre}.`}
          />
        </div>
      </section>
    </main>
  );
}
