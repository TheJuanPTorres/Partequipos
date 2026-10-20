import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaginaMarcaNueva } from "@/components/nueva/PaginaMarcaNueva";
import { PaginaMarcaAditamentos } from "@/components/nueva/PaginaMarcaAditamentos";
import { usaDisenoAditamentos } from "@/lib/nueva/paginaAditamentos";
import { getMarcaMaquinariaPorSlug, getMarcasMaquinaria } from "@/lib/queries/getMaquinaria";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { tituloPorDefecto } from "@/lib/seo/porDefecto";
import { imagenDeMedia } from "@/lib/utils/relations";
import { METADATA_404 } from "@/lib/seo/noEncontrada";

type Params = { marca: string };

export async function generateStaticParams(): Promise<Params[]> {
  const marcas = await getMarcasMaquinaria();
  return marcas.map((m) => ({ marca: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { marca: slug } = await params;
  const marca = await getMarcaMaquinariaPorSlug(slug);
  if (!marca) return METADATA_404;

  return metadataDe({
    nombre: tituloPorDefecto.marcaMaquinaria(marca.nombre),
    path: rutas.marcaMaquinaria(marca.slug),
    descripcion: marca.descripcion,
    seo: marca.seo,
    imageUrl: imagenDeMedia(marca.logo, marca.nombre)?.url,
  });
}

/**
 * PÁGINA DE MARCA DE MAQUINARIA NUEVA: la marca de aditamentos con su plantilla de
 * Andrés (2026-10-20, #283) y las demás con la plantilla «Maquinaria Nueva Marca»
 * (elementor 4023, 2026-10-20), que sustituye a la «Plantilla 1» (2026-10-17).
 */
export default async function MarcaMaquinariaPage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaMaquinariaPorSlug(slug);
  if (!marca) notFound();
  if (usaDisenoAditamentos(marca)) return <PaginaMarcaAditamentos marca={marca} />;
  return <PaginaMarcaNueva marca={marca} />;
}
