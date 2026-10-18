import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  metadataTipoRepuestos,
  PaginaTipoRepuestos,
} from "@/components/repuestos/PaginaTipoRepuestos";
import { getMarcaPorSlug } from "@/lib/queries/getMarcas";
import { getTipoPorSlug, getTipos } from "@/lib/queries/getTipos";
import { esAnidado } from "@/lib/repuestos/anidado";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { poblado } from "@/lib/utils/relations";
import type { Marca } from "@/payload-types";

type Params = { marca: string; tipo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const tipos = await getTipos();

  return tipos.flatMap((tipo) => {
    const marca = poblado<Marca>(tipo.marca);
    // Sin marca poblada no se puede construir la ruta: se omite. Un tipo
    // anidado vive un nivel más abajo (`[modelo]`, src/lib/repuestos/anidado.ts).
    return marca && !esAnidado(tipo) ? [{ marca: marca.slug, tipo: tipo.slug }] : [];
  });
}

/**
 * Resuelve marca + tipo validando que el tipo pertenezca REALMENTE a la marca
 * del path. Devuelve null ante cualquier combinación incoherente, y ante un
 * tipo anidado: su página está bajo la de su tipo padre.
 */
async function resolver(params: Params) {
  const marca = await getMarcaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoPorSlug(marca.id, params.tipo);
  if (!tipo || esAnidado(tipo)) return null;

  return { marca, tipo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  return data ? metadataTipoRepuestos(data.marca, data.tipo) : METADATA_404;
}

/**
 * PÁGINA DE TIPO — PROVISIONAL hasta el diseño de Andrés
 * (docs/diseno/decisiones-repuestos-marca.md §6). El contenido, en
 * `PaginaTipoRepuestos` (común con la del tipo anidado).
 */
export default async function TipoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();
  return <PaginaTipoRepuestos marca={data.marca} tipo={data.tipo} />;
}
