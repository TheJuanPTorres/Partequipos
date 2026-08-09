import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategoriasUsada } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Maquinaria pesada usada";
const DESCRIPCION =
  "Inventario de equipos usados disponibles, organizados por categoría. La disponibilidad cambia: consulta antes de decidir.";

export function generateMetadata(): Metadata {
  return buildMetadata({ nombre: TITULO, path: rutas.usada(), descripcion: DESCRIPCION });
}

export default async function UsadaIndexPage() {
  const categorias = await getCategoriasUsada();

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Usada", path: rutas.usada() },
  ];

  const items = categorias.map((c) => ({
    href: `${rutas.categoriaUsada(c.slug)}/`,
    titulo: c.nombre,
    descripcion: c.descripcion,
    imagen: null,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{TITULO}</h1>
      <p className="mt-3 max-w-2xl text-gray-600">{DESCRIPCION}</p>

      <section className="mt-8" aria-labelledby="categorias-heading">
        <h2 id="categorias-heading" className="text-xl font-medium text-gray-900">
          Categorías
        </h2>
        <div className="mt-4">
          <ListaEnlaces items={items} vacio="Todavía no hay categorías publicadas." />
        </div>
      </section>
    </main>
  );
}
