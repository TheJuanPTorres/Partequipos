import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HeroPortada } from "@/components/hero/HeroPortada";
import { SeccionMaquinariaNueva } from "@/components/portada/SeccionMaquinariaNueva";
import { SeccionMaquinariaUsada } from "@/components/portada/SeccionMaquinariaUsada";
import { SeccionRepuestos } from "@/components/portada/SeccionRepuestos";
import { SeccionCatalogo } from "@/components/portada/SeccionCatalogo";
import { CarruselLogos, SeccionCompania, SeccionTestimonios } from "@/components/portada/diferidos";
import { SeccionFaq } from "@/components/portada/SeccionFaq";
import { SeccionSedes } from "@/components/portada/SeccionSedes";
import { JsonLd } from "@/components/seo/JsonLd";
import { enlaceWhatsApp } from "@/lib/navegacion";
import { diapositivasDeHero } from "@/lib/portada/hero";
import {
  SLUG_EXCAVADORAS,
  hrefDeCategoriaUsada,
  pestanasDeUsada,
  tarjetasDeMarcas,
} from "@/lib/portada/secciones";
import { logosDeMarcas, tarjetasDeRepuestos } from "@/lib/portada/seccionesE";
import { videoDeCompania, videoDeYouTube } from "@/lib/portada/seccionesF";
import { preguntasDeFaq, tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { sedesDePortada, tokenMapbox } from "@/lib/portada/sedes";
import { getCategoriasTecnicasDePortada } from "@/lib/queries/getCategoriasTecnicas";
import { getPreguntasDePortada, getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getVideoPorId } from "@/lib/queries/getVideos";
import {
  getCategoriaUsadaPorSlug,
  getEquiposUsadosDePortada,
  getMarcasDePortada,
} from "@/lib/queries/getMaquinaria";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { getEmpresa, getHorario, getLogo } from "@/lib/queries/getSeo";
import { getSedesDePortada } from "@/lib/queries/getSedes";
import { metadataDe } from "@/lib/seo/metadata";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

/**
 * Portada. El contenido es editable desde Payload (documento con slug
 * `inicio`); aquí no hay texto de negocio quemado.
 */
export async function generateMetadata(): Promise<Metadata> {
  const pagina = await getPaginaPorSlug(SLUG_PORTADA);
  if (!pagina) return {};

  return metadataDe({
    nombre: pagina.titulo,
    path: "/",
    descripcion: pagina.entradilla,
    seo: pagina.seo,
    imageUrl: imagenDeMedia(pagina.seo?.ogImage, pagina.titulo)?.url,
  });
}

export default async function HomePage() {
  const pagina = await getPaginaPorSlug(SLUG_PORTADA);
  if (!pagina) notFound();

  // Textos de las secciones, desde el panel (página «inicio»). Vacío: no se pinta.
  const tx = (v: string | null | undefined) => v?.trim() ?? "";
  const nueva = pagina.seccionNueva;
  const usada = pagina.seccionUsada;
  const repuestos = pagina.seccionRepuestos;
  const compania = pagina.seccionCompania;
  const catalogo = pagina.seccionCatalogo;
  const testimoniosT = pagina.seccionTestimonios;
  const faq = pagina.seccionFaq;
  const diapositivas = diapositivasDeHero(pagina.hero);
  const [
    marcas,
    usados,
    excavadoras,
    categoriasTecnicas,
    testimonios,
    preguntas,
    horario,
    sedes,
    empresa,
    logo,
  ] = await Promise.all([
    getMarcasDePortada(),
    getEquiposUsadosDePortada(),
    getCategoriaUsadaPorSlug(SLUG_EXCAVADORAS),
    getCategoriasTecnicasDePortada(),
    getTestimoniosDePortada(),
    getPreguntasDePortada(),
    getHorario(),
    getSedesDePortada(),
    getEmpresa(),
    getLogo(),
  ]);
  const maquinaFaq = imagenDeMedia(pagina.seccionFaq?.imagen, "");
  const maquinaUsada = imagenDeMedia(pagina.seccionUsada?.imagen, "");
  const relVideo = pagina.seccionCompania?.video;
  const idVideo = typeof relVideo === "object" && relVideo ? relVideo.id : relVideo;
  const videoCompania = videoDeCompania({
    video: idVideo ? await getVideoPorId(idVideo) : null,
  });

  return (
    /*
     * Un solo <main> con las secciones de ux-9 (fase 6). El bloque previo al
     * diseño («Qué encontrarás aquí», «Sobre Partequipos» y contacto) se quitó:
     * sus enlaces están en la cabecera, las secciones y el pie
     * (docs/diseno/decisiones-home-ux9.md §22).
     */
    <main>
      <JsonLd data={buildOrganizationJsonLd(horario, empresa, logo.buscadores)} />

      {/* Sección 1 de ux-9. Sin diapositivas en Payload, no se pinta. */}
      {diapositivas.length > 0 ? <HeroPortada diapositivas={diapositivas} /> : null}

      {/* Secciones 2 y 3 de ux-9 (fase D). Sin datos, no se pintan. */}
      <SeccionMaquinariaNueva
        tarjetas={tarjetasDeMarcas(marcas)}
        textos={{
          antetitulo: tx(nueva?.antetitulo),
          titulo: tx(nueva?.titulo),
          botonTexto: tx(nueva?.botonTexto),
          botonEnlace: tx(nueva?.botonEnlace),
        }}
      />
      <SeccionMaquinariaUsada
        pestanas={pestanasDeUsada(usados, {
          excavadoras: usada?.pestanaExcavadoras,
          otros: usada?.pestanaOtros,
          aditamentos: usada?.pestanaAditamentos,
        })}
        maquina={maquinaUsada ? { ...maquinaUsada, alt: "" } : null}
        hrefExcavadoras={excavadoras ? hrefDeCategoriaUsada(excavadoras.slug) : null}
        textos={{
          antetitulo: tx(usada?.antetitulo),
          titulo: tx(usada?.titulo),
          marcasTitulo: tx(usada?.marcasTitulo),
          marcasTexto: tx(usada?.marcasTexto),
          botonTexto: tx(usada?.botonTexto),
          verProductoTexto: tx(usada?.verProductoTexto),
        }}
      />

      {/* Secciones 4 y 5 de ux-9 (fase E). Sin datos, no se pintan. */}
      <CarruselLogos logos={logosDeMarcas(pagina.seccionLogos)} />
      <SeccionRepuestos
        tarjetas={tarjetasDeRepuestos(categoriasTecnicas)}
        textos={{
          antetitulo: tx(repuestos?.antetitulo),
          titulo: tx(repuestos?.titulo),
          verMasTexto: tx(repuestos?.verMasTexto),
          botonTexto: tx(repuestos?.botonTexto),
          botonEnlace: tx(repuestos?.botonEnlace),
        }}
      />

      {/* Secciones 6, 7 y 8 de ux-9 (fase F). Sin vídeo, la tarjeta va en oscuro. */}
      <SeccionCompania
        video={videoCompania}
        youtube={videoDeYouTube(compania?.youtube)}
        textos={{
          titulo: tx(compania?.titulo),
          texto: tx(compania?.texto),
          marquesina: tx(compania?.marquesina),
          marquesinaEnlace: tx(compania?.marquesinaEnlace),
        }}
      />
      <SeccionCatalogo
        whatsapp={enlaceWhatsApp(empresa.whatsapp)}
        textos={{
          titulo: tx(catalogo?.titulo),
          catalogoTexto: tx(catalogo?.catalogoTexto),
          catalogoEnlace: tx(catalogo?.catalogoEnlace),
          whatsappTexto: tx(catalogo?.whatsappTexto),
        }}
      />

      {/* Sección 9 de ux-9 (fase G). Globo solo con token de Mapbox; sin él, la lista. */}
      <SeccionSedes
        sedes={sedesDePortada(sedes)}
        token={tokenMapbox(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)}
        titulo={tx(pagina.seccionSedes?.titulo)}
      />

      {/* Secciones 10 y 11 de ux-9 (fase H). Sin datos publicados, no se pintan. */}
      <SeccionTestimonios
        tarjetas={tarjetasDeTestimonios(testimonios)}
        textos={{
          titulo: tx(testimoniosT?.titulo),
          verVideoTexto: tx(testimoniosT?.verVideoTexto),
        }}
      />
      <SeccionFaq
        preguntas={preguntasDeFaq(preguntas)}
        imagen={maquinaFaq ? { ...maquinaFaq, alt: "" } : null}
        textos={{
          titulo: tx(faq?.titulo),
          intro: tx(faq?.intro),
          botonTexto: tx(faq?.botonTexto),
          botonEnlace: tx(faq?.botonEnlace),
        }}
      />
    </main>
  );
}
