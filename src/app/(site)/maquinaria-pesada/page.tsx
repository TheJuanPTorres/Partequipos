import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Maquinaria pesada";
const DESCRIPCION =
  "Maquinaria pesada nueva y usada para construcción, infraestructura y agroindustria, con respaldo técnico y repuestos.";

export function generateMetadata(): Metadata {
  return buildMetadata({ nombre: TITULO, path: rutas.maquinaria(), descripcion: DESCRIPCION });
}

export default function MaquinariaIndexPage() {
  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: TITULO, path: rutas.maquinaria() },
  ];

  const lineas = [
    {
      href: `${rutas.nueva()}/`,
      titulo: "Maquinaria pesada nueva",
      descripcion: "Equipos nuevos por marca y tipo, con ficha técnica y cotización.",
      imagen: null,
    },
    {
      href: `${rutas.usada()}/`,
      titulo: "Maquinaria pesada usada",
      descripcion: "Inventario de equipos usados disponibles, por categoría.",
      imagen: null,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{TITULO}</h1>
      <p className="mt-3 max-w-2xl text-gray-600">{DESCRIPCION}</p>

      <section className="mt-8" aria-labelledby="lineas-heading">
        <h2 id="lineas-heading" className="text-xl font-medium text-gray-900">
          Líneas
        </h2>
        <div className="mt-4">
          <ListaEnlaces items={lineas} vacio="No hay líneas disponibles." />
        </div>
      </section>
    </main>
  );
}
