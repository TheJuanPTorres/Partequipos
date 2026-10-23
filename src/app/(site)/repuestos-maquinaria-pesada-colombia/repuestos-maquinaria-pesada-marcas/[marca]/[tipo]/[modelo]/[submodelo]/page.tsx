import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import {
  metadataModeloRepuesto,
  PaginaModeloRepuesto,
} from "@/components/repuestos/PaginaModeloRepuesto";
import { getMarcaPorSlug } from "@/lib/queries/getMarcas";
import { getModeloPorSlug, getModelos } from "@/lib/queries/getModelos";
import { getTipoPorSlug } from "@/lib/queries/getTipos";
import { productoVisible } from "@/lib/nueva/visibilidad";
import { segmentoDeTipo } from "@/lib/repuestos/anidado";
import { rutas } from "@/lib/routes";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { poblado } from "@/lib/utils/relations";
import type { Marca, TiposEquipo } from "@/payload-types";

/**
 * FICHA DE UN MODELO DE UN TIPO ANIDADO (2026-10-17, dirección): las 4
 * excavadoras de CASE conservan su URL de WordPress, un nivel más abajo que
 * las demás fichas: `<marca>/<tipo padre>/<tipo anidado>/<modelo>`
 * (src/lib/repuestos/anidado.ts). El contenido es el de cualquier ficha.
 */
type Params = { marca: string; tipo: string; modelo: string; submodelo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const modelos = await getModelos();

  return modelos.flatMap((modelo) => {
    const marca = poblado<Marca>(modelo.marca);
    const tipo = poblado<TiposEquipo>(modelo.tipo);
    if (!marca || !tipo?.slugPadre) return [];
    return [{ marca: marca.slug, tipo: tipo.slugPadre, modelo: tipo.slug, submodelo: modelo.slug }];
  });
}

async function resolver(params: Params) {
  const marca = await getMarcaPorSlug(params.marca);
  if (!marca) return null;

  // `[modelo]` es aquí el tipo anidado, que tiene que colgar de `[tipo]`.
  const tipo = await getTipoPorSlug(marca.id, params.modelo);
  if (!tipo || tipo.slugPadre !== params.tipo) return null;

  const modelo = await getModeloPorSlug(tipo.id, params.submodelo);
  if (!modelo) return null;

  return { marca, tipo, modelo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  return data && productoVisible(data.modelo)
    ? metadataModeloRepuesto(data.marca, data.tipo, data.modelo)
    : METADATA_404;
}

export default async function ModeloAnidadoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();
  // Modelo oculto: redirección TEMPORAL (307) a la página de su tipo anidado.
  if (!productoVisible(data.modelo)) {
    redirect(`${rutas.tipo(data.marca.slug, segmentoDeTipo(data.tipo))}/`);
  }
  return <PaginaModeloRepuesto marca={data.marca} tipo={data.tipo} modelo={data.modelo} />;
}
