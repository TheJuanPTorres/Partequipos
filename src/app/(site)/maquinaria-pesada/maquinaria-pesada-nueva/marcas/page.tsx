import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarcasMaquinaria } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

const TITULO = "Marcas de maquinaria pesada nueva";
const DESCRIPCION = "Marcas que distribuimos, con sus tipos de equipo y modelos disponibles.";

export function generateMetadata(): Metadata {
  return buildMetadata({
    nombre: TITULO,
    path: rutas.marcasMaquinaria(),
    descripcion: DESCRIPCION,
  });
}

export default async function MarcasMaquinariaPage() {
  const marcas = await getMarcasMaquinaria();

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Maquinaria pesada", path: rutas.maquinaria() },
    { nombre: "Nueva", path: rutas.nueva() },
    { nombre: "Marcas", path: rutas.marcasMaquinaria() },
  ];

  const items = marcas.map((marca) => ({
    href: `${rutas.marcaMaquinaria(marca.slug)}/`,
    titulo: marca.nombre,
    descripcion: marca.descripcion,
    imagen: imagenDeMedia(marca.logo, `Logo de ${marca.nombre}`),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{TITULO}</h1>
      <p className="mt-3 max-w-2xl text-gray-600">{DESCRIPCION}</p>

      <div className="mt-8">
        <ListaEnlaces items={items} vacio="Todavía no hay marcas publicadas." />
      </div>
    </main>
  );
}
