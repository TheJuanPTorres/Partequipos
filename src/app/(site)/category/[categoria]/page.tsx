import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListaArticulos } from "@/components/blog/ListaArticulos";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  getArticulosDeCategoria,
  getCategoriaBlogPorSlug,
  getCategoriasBlog,
} from "@/lib/queries/getBlog";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

/**
 * Archivo de categoría del blog: `/category/{slug}/`.
 *
 * El segmento `category` es el que genera WordPress. Se conserva tal cual
 * porque `/category/noticias/` está indexada y la jerarquía de URLs es
 * intocable (CLAUDE.md §3.3) — no porque nos guste el nombre.
 *
 * Duplica en buena parte a `/noticias/`. Consolidarlas es decisión del cliente
 * (ADR 0008); mientras tanto las dos existen, como en el sitio actual.
 */
type Params = { categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const categorias = await getCategoriasBlog();
  return categorias.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaBlogPorSlug(slug);
  if (!categoria) return {};

  return buildMetadata({
    nombre: categoria.nombre,
    path: rutas.categoriaBlog(categoria.slug),
    descripcion: categoria.descripcion,
    seo: categoria.seo,
  });
}

export default async function CategoriaBlogPage({ params }: { params: Promise<Params> }) {
  const { categoria: slug } = await params;
  const categoria = await getCategoriaBlogPorSlug(slug);
  if (!categoria) notFound();

  const articulos = await getArticulosDeCategoria(categoria.id);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Noticias", path: rutas.blog() },
    { nombre: categoria.nombre, path: rutas.categoriaBlog(categoria.slug) },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{categoria.nombre}</h1>

      {categoria.descripcion ? (
        <p className="mt-3 max-w-2xl text-gray-600">{categoria.descripcion}</p>
      ) : null}

      <section className="mt-8" aria-labelledby="articulos-heading">
        <h2 id="articulos-heading" className="text-xl font-medium text-gray-900">
          {articulos.length} {articulos.length === 1 ? "artículo" : "artículos"}
        </h2>

        <div className="mt-4">
          <ListaArticulos
            articulos={articulos}
            vacio={`Todavía no hay artículos en ${categoria.nombre}.`}
          />
        </div>
      </section>

      <nav className="mt-10 border-t border-gray-200 pt-6 text-sm" aria-label="Navegación del blog">
        <Link href={`${rutas.blog()}/`} className="underline">
          ← Ver todas las noticias
        </Link>
      </nav>
    </main>
  );
}
