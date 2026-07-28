import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMarcas } from "@/lib/queries/getMarcas";
import { rutas } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { buildBreadcrumbJsonLd, buildOrganizationJsonLd } from "@/lib/seo/jsonLd";

const TITULO = "Repuestos para maquinaria pesada en Colombia";
const DESCRIPCION =
  "Catálogo de repuestos para maquinaria pesada: excavadoras, bulldozers, retrocargadoras, motoniveladoras y más, organizados por marca y tipo de equipo.";

export function generateMetadata(): Metadata {
  return buildMetadata({ nombre: TITULO, path: rutas.repuestos(), descripcion: DESCRIPCION });
}

export default async function RepuestosIndexPage() {
  const marcas = await getMarcas();

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: "Repuestos", path: rutas.repuestos() },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={[buildOrganizationJsonLd(), buildBreadcrumbJsonLd(breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} />

      <h1 className="text-3xl font-semibold text-gray-900">{TITULO}</h1>
      <p className="mt-3 max-w-2xl text-gray-600">{DESCRIPCION}</p>

      <section className="mt-8" aria-labelledby="marcas-heading">
        <h2 id="marcas-heading" className="text-xl font-medium text-gray-900">
          Repuestos por marca
        </h2>
        <p className="mt-2 text-gray-600">
          {marcas.length} {marcas.length === 1 ? "marca disponible" : "marcas disponibles"}.{" "}
          <Link href={rutas.marcas()} className="underline hover:text-gray-900">
            Ver todas las marcas
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
