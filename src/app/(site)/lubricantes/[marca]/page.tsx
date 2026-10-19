import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaginaMarcaLubricante } from "@/components/lubricantes/PaginaMarcaLubricante";
import { JsonLd } from "@/components/seo/JsonLd";
import { seccionesDeCategorias } from "@/lib/lubricantes/marca";
import {
  getCategoriasDeMarcaLubricante,
  getMarcaLubricantePorSlug,
  getMarcasLubricante,
} from "@/lib/queries/getLubricantes";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";

type Params = { marca: string };

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcasLubricante();
  return marcas.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.marcaLubricante(marca.nombre),
    path: rutas.marcaLubricante(marca.slug),
    descripcion: marca.entradilla,
    seo: marca.seo,
    imageUrl: (imagenDeMedia(marca.imagenCabecera, "") ?? imagenDeMedia(marca.logo, marca.nombre))
      ?.url,
  });
}

/**
 * PÁGINA DE UNA MARCA DE LUBRICANTES (`/lubricantes/lubricantes-eni/`): un «sitio dentro del
 * sitio» con la identidad de la marca (2026-10-19, cliente). El diseño, en
 * `PaginaMarcaLubricante`; los colores, desde el panel.
 *
 * Las 4 subpáginas de WordPress (auto liviano, auto pesado, engranajes, motos y
 * scooter) son SECCIONES de esta página desde el 2026-10-14, con su `slug`
 * como ancla y un 301 desde la URL antigua (decisión de dirección; detalle en
 * docs/diseno/decisiones-servicio-lubricantes.md).
 */
export default async function MarcaLubricantePage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) notFound();

  const [categorias, empresa] = await Promise.all([
    getCategoriasDeMarcaLubricante(marca.id),
    getEmpresa(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: `Lubricantes ${marca.nombre}`, path: rutas.marcaLubricante(marca.slug) },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <PaginaMarcaLubricante
        marca={marca}
        secciones={seccionesDeCategorias(categorias)}
        whatsapp={enlaceWhatsApp(
          empresa.whatsapp,
          `Hola, quiero cotizar lubricantes ${marca.nombre}`,
        )}
      />
    </>
  );
}
