import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaginaMarcaLubricante } from "@/components/lubricantes/PaginaMarcaLubricante";
import { PaginaMarcaLubricantePlantilla } from "@/components/lubricantes/PaginaMarcaLubricantePlantilla";
import { JsonLd } from "@/components/seo/JsonLd";
import { vistaLubricantes } from "@/lib/lubricantes/general";
import { seccionesDeCategorias } from "@/lib/lubricantes/marca";
import {
  getCategoriasDeMarcaLubricante,
  getMarcaLubricantePorSlug,
  getMarcasLubricante,
} from "@/lib/queries/getLubricantes";
import { getPaginasIndice } from "@/lib/queries/getPaginasIndice";
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
 * PÁGINA DE UNA MARCA DE LUBRICANTES (`/lubricantes/lubricantes-eni/`). Por defecto, la
 * plantilla de Andrés «Categoría Lubricantes» (3946, dirección 2026-10-21; antes, una versión
 * provisional sencilla); con la casilla «Diseño propio» de la marca, el «sitio dentro del sitio»
 * con su identidad (`PaginaMarcaLubricante`, #260), con los colores desde el panel.
 *
 * Las 4 líneas (auto liviano, auto pesado, engranajes, motos y scooter) tienen su página
 * desde el 2026-10-22 (`[categoria]`, plantilla 4039), en su URL de WordPress; la plantilla
 * de esta solo pinta sus tarjetas, y el diseño propio las sigue pintando como secciones
 * (detalle en docs/diseno/decisiones-servicio-lubricantes.md §10).
 */
export default async function MarcaLubricantePage({ params }: { params: Promise<Params> }) {
  const { marca: slug } = await params;
  const marca = await getMarcaLubricantePorSlug(slug);
  if (!marca) notFound();

  const [categorias, empresa, indice, marcas] = await Promise.all([
    getCategoriasDeMarcaLubricante(marca.id),
    getEmpresa(),
    getPaginasIndice(),
    getMarcasLubricante(),
  ]);

  const breadcrumbs = [
    { nombre: "Inicio", path: "/" },
    { nombre: `Lubricantes ${marca.nombre}`, path: rutas.marcaLubricante(marca.slug) },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbs)} />
      {/* En producción solo van plantillas de Andrés: el diseño propio es opt-in (dirección, 2026-10-19). */}
      {marca.disenoPropio ? (
        <PaginaMarcaLubricante
          marca={marca}
          secciones={seccionesDeCategorias(categorias)}
          whatsapp={enlaceWhatsApp(
            empresa.whatsapp,
            `Hola, quiero cotizar lubricantes ${marca.nombre}`,
          )}
        />
      ) : (
        <PaginaMarcaLubricantePlantilla
          marca={marca}
          secciones={seccionesDeCategorias(categorias)}
          // Los textos del bloque final son los de la página general (`/lubricantes/`), del panel.
          bloque={vistaLubricantes(indice.lubricantes, marcas).bloque}
          whatsapp={enlaceWhatsApp(empresa.whatsapp)}
        />
      )}
    </>
  );
}
