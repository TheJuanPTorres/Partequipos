import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ListaEnlaces } from "@/components/catalog/ListaEnlaces";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarcas } from "@/lib/queries/getMarcas";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

const TITULO = "Marcas de repuestos para maquinaria pesada";
const DESCRIPCION =
  "Encuentra repuestos por marca de maquinaria pesada. Cada marca reúne sus tipos de equipo y los modelos disponibles.";

export function generateMetadata(): Metadata {
  return buildMetadata({ nombre: TITULO, path: rutas.marcas(), descripcion: DESCRIPCION });
}

export default async function MarcasIndexPage() {
  const marcas = await getMarcas();

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
    { nombre: "Marcas", path: rutas.marcas() },
  ];

  const items = marcas.map((marca) => ({
    href: rutas.marca(marca.slug),
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
        <ListaEnlaces items={items} vacio="No hay marcas publicadas todavía." />
      </div>
    </main>
  );
}
