import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCategoriasMaquinaria, getMarcasMaquinaria } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Maquinaria pesada nueva";
const DESCRIPCION =
  "Equipos nuevos organizados por marca y tipo, con ficha técnica y solicitud de cotización.";

export function generateMetadata(): Metadata {
  return buildMetadata({ nombre: TITULO, path: rutas.nueva(), descripcion: DESCRIPCION });
}

export default async function NuevaIndexPage() {
  const [categorias, marcas] = await Promise.all([
    getCategoriasMaquinaria(),
    getMarcasMaquinaria(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
  ];

  const items = categorias.map((c) => ({
    href: `${rutas.categoriaNueva(c.slug)}/`,
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
          Por tipo de equipo
        </h2>
        <div className="mt-4">
          <ListaEnlaces items={items} vacio="Todavía no hay categorías publicadas." />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="marcas-heading">
        <h2 id="marcas-heading" className="text-xl font-medium text-gray-900">
          Por marca
        </h2>
        <div className="mt-4">
          <ListaEnlaces
            items={[
              {
                href: `${rutas.marcasMaquinaria()}/`,
                titulo: "Todas las marcas",
                descripcion: `${marcas.length} ${marcas.length === 1 ? "marca disponible" : "marcas disponibles"}.`,
                imagen: null,
              },
            ]}
            vacio="Todavía no hay marcas publicadas."
          />
        </div>
      </section>
    </main>
  );
}
