import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PaginaFichaNueva } from "@/components/ficha/PaginaFichaNueva";
import {
  getEquipoNuevoPorSlug,
  getEquiposNuevos,
  getMarcaMaquinariaPorSlug,
  getTipoMaquinariaPorSlug,
} from "@/lib/queries/getMaquinaria";
import { productoVisible } from "@/lib/nueva/visibilidad";
import { rutas } from "@/lib/routes";
import { metadataDe } from "@/lib/seo/metadata";
import { METADATA_404 } from "@/lib/seo/noEncontrada";
import { imagenDeMedia, poblado } from "@/lib/utils/relations";
import type { MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

/*
 * FICHA DE EQUIPO NUEVO — plantilla de Andrés «Ficha maquinaria nueva»
 * (elementor 4036, 2026-10-21; docs/diseno/decisiones-ficha-nueva.md). La usan
 * los equipos nuevos y los aditamentos nuevos; la usada sigue con la V2. Las
 * URL, el SEO (metadatos y JSON-LD) y los datos no cambian. La ficha está en
 * `PaginaFichaNueva`, que comparte con la vista previa en vivo del panel.
 */

type Params = { marca: string; tipo: string; modelo: string };

export async function generateStaticParams(): Promise<Params[]> {
  const equipos = await getEquiposNuevos();

  return equipos.flatMap((equipo) => {
    const marca = poblado<MarcasMaquinaria>(equipo.marca);
    const tipo = poblado<TiposMaquinaria>(equipo.tipo);
    if (!marca || !tipo) return [];
    return [{ marca: marca.slug, tipo: tipo.slug, modelo: equipo.slug }];
  });
}

/**
 * Resuelve la cadena completa validando coherencia: el tipo debe pertenecer a la
 * marca y el equipo al tipo. Una combinación cruzada devuelve null → 404.
 */
async function resolver(params: Params) {
  const marca = await getMarcaMaquinariaPorSlug(params.marca);
  if (!marca) return null;

  const tipo = await getTipoMaquinariaPorSlug(marca.id, params.tipo);
  if (!tipo) return null;

  const equipo = await getEquipoNuevoPorSlug(tipo.id, params.modelo);
  if (!equipo) return null;

  return { marca, tipo, equipo };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await resolver(await params);
  // Un equipo oculto redirige a su tipo: no se indexa (`conProductoVisible`, visibilidad.ts).
  if (!data || !productoVisible(data.equipo)) return METADATA_404;

  const { marca, tipo, equipo } = data;
  const imagenes = Array.isArray(equipo.imagenes) ? equipo.imagenes : [];

  return metadataDe({
    nombre: equipo.nombre,
    path: rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug),
    descripcion: equipo.entradilla,
    seo: equipo.seo,
    imageUrl: imagenDeMedia(imagenes[0], equipo.nombre)?.url,
  });
}

export default async function EquipoNuevoPage({ params }: { params: Promise<Params> }) {
  const data = await resolver(await params);
  if (!data) notFound();
  const { marca, tipo, equipo } = data;
  // «Mostrar en la web» desmarcada: redirección TEMPORAL (307) a la página de su tipo.
  if (!productoVisible(equipo)) redirect(`${rutas.tipoMaquinaria(marca.slug, tipo.slug)}/`);

  return <PaginaFichaNueva marca={marca} tipo={tipo} equipo={equipo} />;
}
