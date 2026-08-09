import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategoriaUsadaPorSlug,
  getCategoriasUsada,
  getEquiposUsadosDeCategoria,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

/**
 * Categoría de maquinaria USADA.
 *
 * Aquí sí se renderiza el inventario en la propia página: las unidades no tienen
 * URL propia (ADR 0007), así que esta ruta es su único escaparate. Solo se
 * listan las disponibles; las vendidas se marcan, no se borran.
 */
type Params = { categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasUsada();
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) return {};

  return buildMetadata({
    nombre: `${categoria.nombre} usadas`,
    path: rutas.categoriaUsada(categoria.slug),
    descripcion: categoria.descripcion,
    seo: categoria.seo,
  });
}

export default async function CategoriaUsadaPage({ params }: { params: Promise<Params> }) {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaUsadaPorSlug(slug);
  if (!categoria) notFound();

  const unidades = await getEquiposUsadosDeCategoria(categoria.id);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
    { nombre: categoria.nombre, path: rutas.categoriaUsada(categoria.slug) },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{categoria.nombre} usadas</h1>

      {categoria.descripcion ? (
        <p className="mt-3 max-w-2xl text-gray-600">{categoria.descripcion}</p>
      ) : null}

      <section className="mt-8" aria-labelledby="unidades-heading">
        <h2 id="unidades-heading" className="text-xl font-medium text-gray-900">
          {unidades.length} {unidades.length === 1 ? "unidad disponible" : "unidades disponibles"}
        </h2>

        {unidades.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-gray-300 p-6 text-center text-gray-600">
            No hay unidades disponibles en esta categoría ahora mismo. El inventario cambia con
            frecuencia: escríbenos y te avisamos cuando entre una.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {unidades.map((unidad) => {
              const primera = Array.isArray(unidad.imagenes) ? unidad.imagenes[0] : null;
              const imagen = imagenDeMedia(primera, unidad.nombre);

              return (
                <li key={unidad.id} className="rounded-lg border border-gray-200 p-4">
                  {imagen ? (
                    <Image
                      src={imagen.url}
                      alt={imagen.alt}
                      width={imagen.width}
                      height={imagen.height}
                      className="mb-3 h-40 w-full object-contain"
                    />
                  ) : null}

                  <h3 className="font-medium text-gray-900">{unidad.nombre}</h3>

                  <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    {unidad.anio ? (
                      <div className="flex gap-1">
                        <dt className="font-medium">Año:</dt>
                        <dd>{unidad.anio}</dd>
                      </div>
                    ) : null}
                    {typeof unidad.horometro === "number" ? (
                      <div className="flex gap-1">
                        <dt className="font-medium">Horómetro:</dt>
                        <dd>{unidad.horometro.toLocaleString("es-CO")} h</dd>
                      </div>
                    ) : null}
                    {unidad.ubicacion ? (
                      <div className="flex gap-1">
                        <dt className="font-medium">Ubicación:</dt>
                        <dd>{unidad.ubicacion}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {unidad.descripcion ? (
                    <p className="mt-2 text-sm text-gray-700">{unidad.descripcion}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
