import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaginaLineaLubricante } from "@/components/lubricantes/PaginaLineaLubricante";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaLubricantes } from "@/lib/lubricantes/general";
import {
  getCategoriaLubricante,
  getCategoriasLubricante,
  getMarcaLubricantePorSlug,
  getMarcasLubricante,
} from "@/lib/queries/getLubricantes";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
import { getEmpresa } from "@/lib/queries/getSeo";
import { rutas } from "@/lib/routes";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonLd";
import { metadataDe } from "@/lib/seo/metadata";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { imagenDeMedia } from "@/lib/utils/relations";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import type { CategoriasLubricante, MarcasLubricante } from "@/payload-types";

type Params = { marca: string; categoria: string };

export async function generateStaticParams(): Promise<Params[]> {
  const lineas = await getCategoriasLubricante();
  return lineas.map((l) => ({ marca: l.marcaSlug, categoria: l.slug }));
}

async function lineaDe(
  params: Promise<Params>,
): Promise<{ marca: MarcasLubricante; linea: CategoriasLubricante } | null> {
  const { marca: marcaSlug, categoria } = await params;
  const marca = await getMarcaLubricantePorSlug(marcaSlug);
  if (!marca) return null;
  const linea = await getCategoriaLubricante(marca.id, categoria);
  return linea ? { marca, linea } : null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const datos = await lineaDe(params);
  if (!datos) return METADATA_404;
  const { marca, linea } = datos;

  return metadataDe({
    nombre: tituloPorDefecto.categoriaLubricante(linea.nombre, marca.nombre),
    path: rutas.categoriaLubricante(marca.slug, linea.slug),
    descripcion: linea.entradilla?.trim() || marca.entradilla,
    seo: linea.seo,
    imageUrl: (imagenDeMedia(linea.imagenCabecera, "") ?? imagenDeMedia(linea.imagen, ""))?.url,
  });
}

/**
 * PÁGINA DE UNA LÍNEA DE LUBRICANTES (`/lubricantes/lubricantes-eni/auto-liviano/`), en su
 * URL de WordPress, con la plantilla de Andrés 4039 (dirección, 2026-10-22). Del 2026-10-14
 * al 21 estas URL daban un 301 al ancla de la línea en la página de la marca; la migración
 * `20261022_014813_lubricantes_lineas_paginas` quita esos 301.
 */
export default async function LineaLubricantePage({ params }: { params: Promise<Params> }) {
  const datos = await lineaDe(params);
  if (!datos) notFound();
  const { marca, linea } = datos;

  const [empresa, indice, marcas] = await Promise.all([
    getEmpresa(),
    getPaginasIndice(),
    getMarcasLubricante(),
  ]);

  const migas: BreadcrumbItem[] = [
    { nombre: "Inicio", path: "/" },
    { nombre: `Lubricantes ${marca.nombre}`, path: rutas.marcaLubricante(marca.slug) },
    { nombre: linea.nombre, path: rutas.categoriaLubricante(marca.slug, linea.slug) },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />
      <PaginaLineaLubricante
        marca={marca}
        linea={linea}
        migas={migas}
        // Los textos del bloque final son los de la página general (`/lubricantes/`), del panel.
        bloque={vistaLubricantes(indice.lubricantes, marcas).bloque}
        whatsapp={enlaceWhatsApp(empresa.whatsapp)}
      />
    </>
  );
}
