import type { Metadata } from "next";

import { ListaArticulos } from "@/components/blog/ListaArticulos";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getArticulos } from "@/lib/queries/getBlog";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

/**
 * Índice del blog: `/noticias/`.
 *
 * Es una de las TRES puertas de entrada al mismo contenido que tiene el sitio
 * actual, junto a `/blog-partequipos/` y `/category/noticias/`. Las tres se
 * conservan por decisión de dirección: un 301 sobre URLs indexadas es difícil
 * de revertir y esa decisión es del cliente (ADR 0008, CLAUDE.md §10.3).
 *
 * De las tres, esta es la que tiene meta description propia y redactada, así
 * que es la candidata natural a canónica si algún día se consolidan.
 *
 * Ruta estática: gana sobre el comodín `[...slug]` por precedencia de Next.
 */
export const metadata: Metadata = buildMetadata({
  nombre: "Noticias",
  path: rutas.blog(),
  descripcion:
    "Novedades, guías técnicas y tendencias de maquinaria pesada, repuestos y mantenimiento.",
});

export default async function BlogIndicePage() {
  const articulos = await getArticulos();

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Noticias", path: rutas.blog() },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">Noticias</h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        Novedades, guías técnicas y tendencias de maquinaria pesada, repuestos y mantenimiento.
      </p>

      <section className="mt-8" aria-labelledby="articulos-heading">
        <h2 id="articulos-heading" className="text-xl font-medium text-gray-900">
          {articulos.length} {articulos.length === 1 ? "artículo" : "artículos"}
        </h2>

        <div className="mt-4">
          <ListaArticulos articulos={articulos} vacio="Todavía no hay artículos publicados." />
        </div>
      </section>
    </main>
  );
}
