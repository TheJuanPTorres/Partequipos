import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getCategoriasUsada,
  getInventarioUsados,
  getMarcasUsada,
} from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Maquinaria pesada usada";
const DESCRIPCION =
  "Inventario de equipos usados disponibles, organizados por categoría. La disponibilidad cambia: consulta antes de decidir.";

export async function generateMetadata(): Promise<Metadata> {
  return metadataDe({ nombre: TITULO, path: rutas.usada(), descripcion: DESCRIPCION });
}

export default async function UsadaIndexPage() {
  const [categorias, marcas, inventario] = await Promise.all([
    getCategoriasUsada(),
    getMarcasUsada(),
    getInventarioUsados(),
  ]);

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

  // Marcas con unidades disponibles (paso b del marketplace): cada una tiene
  // su página. Las que no tienen unidades no se enlazan (D4: no se indexan).
  const marcasConUnidades = marcas
    .map((m) => ({ m, n: inventario.filter((u) => u.marcaUsada === m.id).length }))
    .filter(({ n }) => n > 0)
    .map(({ m, n }) => ({
      href: `${rutas.marcaUsada(m.slug)}/`,
      titulo: m.nombre,
      descripcion: `${n} ${n === 1 ? "unidad disponible" : "unidades disponibles"}`,
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

      {marcasConUnidades.length ? (
        <section className="mt-10" aria-labelledby="marcas-heading">
          <h2 id="marcas-heading" className="text-xl font-medium text-gray-900">
            Marcas
          </h2>
          <div className="mt-4">
            <ListaEnlaces items={marcasConUnidades} vacio="" />
          </div>
        </section>
      ) : null}
    </main>
  );
}
