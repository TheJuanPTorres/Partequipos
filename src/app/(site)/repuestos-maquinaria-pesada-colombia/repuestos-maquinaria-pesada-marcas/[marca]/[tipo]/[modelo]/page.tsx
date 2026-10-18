import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  metadataModeloRepuesto,
  PaginaModeloRepuesto,
} from "@/components/repuestos/PaginaModeloRepuesto";
import {
  metadataTipoRepuestos,
  PaginaTipoRepuestos,
} from "@/components/repuestos/PaginaTipoRepuestos";
import { getMarcaPorSlug } from "@/lib/queries/getMarcas";
import { getModeloPorSlug, getModelos } from "@/lib/queries/getModelos";
import { getTipoPorSlug, getTipos } from "@/lib/queries/getTipos";
import { esAnidado } from "@/lib/repuestos/anidado";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { poblado } from "@/lib/utils/relations";
import type { Marca, TiposEquipo } from "@/payload-types";

type Params = { marca: string; tipo: string; modelo: string };

/**
 * Este nivel sirve dos cosas: la FICHA de un modelo y, para un tipo ANIDADO
 * (la «Excavadora» de CASE, que en WordPress colgaba de «Cargador frontal»,
 * src/lib/repuestos/anidado.ts), la PÁGINA DE ESE TIPO bajo la de su padre.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const [modelos, tipos] = await Promise.all([getModelos(), getTipos()]);

  const fichas = modelos.flatMap((modelo) => {
    const marca = poblado<Marca>(modelo.marca);
    const tipo = poblado<TiposEquipo>(modelo.tipo);
    // Los modelos de un tipo anidado tienen un nivel más (`[submodelo]`).
    if (!marca || !tipo || esAnidado(tipo)) return [];
    return [{ marca: marca.slug, tipo: tipo.slug, modelo: modelo.slug }];
  });
  const anidados = tipos.flatMap((tipo) => {
    const marca = poblado<Marca>(tipo.marca);
    if (!marca || !tipo.slugPadre) return [];
    return [{ marca: marca.slug, tipo: tipo.slugPadre, modelo: tipo.slug }];
  });
  return [...fichas, ...anidados];
}

/**
 * Resuelve marca + tipo + modelo validando la coherencia de toda la cadena:
 * el tipo debe pertenecer a la marca y el modelo al tipo. Si no hay modelo,
 * prueba con un tipo anidado de ese tipo. Una combinación inventada → null (404).
 */
async function resolver(params: Params) {
  const marca = await getMarcaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoPorSlug(marca.id, params.tipo);
  if (!tipo || esAnidado(tipo)) return null;

  const modelo = await getModeloPorSlug(tipo.id, params.modelo);
  if (modelo) return { clase: "modelo" as const, marca, tipo, modelo };

  const anidado = await getTipoPorSlug(marca.id, params.modelo);
  if (anidado && anidado.slugPadre === tipo.slug) {
    return { clase: "tipo" as const, marca, tipo: anidado };
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  if (!data) return METADATA_404;
  return data.clase === "modelo"
    ? metadataModeloRepuesto(data.marca, data.tipo, data.modelo)
    : metadataTipoRepuestos(data.marca, data.tipo);
}

export default async function ModeloPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();
  return data.clase === "modelo" ? (
    <PaginaModeloRepuesto marca={data.marca} tipo={data.tipo} modelo={data.modelo} />
  ) : (
    <PaginaTipoRepuestos marca={data.marca} tipo={data.tipo} />
  );
}
