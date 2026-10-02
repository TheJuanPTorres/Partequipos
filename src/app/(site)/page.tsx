import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HeroPortada } from "@/components/hero/HeroPortada";
import { SeccionMaquinariaNueva } from "@/components/portada/SeccionMaquinariaNueva";
import { SeccionMaquinariaUsada } from "@/components/portada/SeccionMaquinariaUsada";
import { SeccionRepuestos } from "@/components/portada/SeccionRepuestos";
import { SeccionCatalogo } from "@/components/portada/SeccionCatalogo";
import { CarruselLogos, SeccionCompania, SeccionTestimonios } from "@/components/portada/diferidos";
import { SeccionFaq } from "@/components/portada/SeccionFaq";
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
import { getCategoriasTecnicasDePortada } from "@/lib/queries/getCategoriasTecnicas";
import { getPreguntasDePortada, getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getVideoPorId } from "@/lib/queries/getVideos";
import {
  getCategoriaUsadaPorSlug,
  getEquiposUsadosDePortada,
  getMarcasDePortada,
} from "@/lib/queries/getMaquinaria";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { buildMetadata } from "@/lib/seo/buildMetadata";
import { seoConfig } from "@/lib/seo/config";
import { buildOrganizationJsonLd } from "@/lib/seo/jsonLd";
import { imagenDeMedia } from "@/lib/utils/relations";

/**
 * Portada. El contenido es editable desde Payload (documento con slug
 * `inicio`); aquí no hay texto de negocio quemado.
 */
export async function generateMetadata(): Promise<Metadata> {
  const pagina = await getPaginaPorSlug(SLUG_PORTADA);
  if (!pagina) return {};

  return buildMetadata({
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

  const { contact } = seoConfig;
  const diapositivas = diapositivasDeHero(pagina.hero);
  const [marcas, usados, excavadoras, categoriasTecnicas, testimonios, preguntas] =
    await Promise.all([
      getMarcasDePortada(),
      getEquiposUsadosDePortada(),
      getCategoriaUsadaPorSlug(SLUG_EXCAVADORAS),
      getCategoriasTecnicasDePortada(),
      getTestimoniosDePortada(),
      getPreguntasDePortada(),
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
     * sus enlaces están en la cabecera, las secciones y el pie, y el horario
     * queda en el JSON-LD `Organization`.
     */
    <main>
      <JsonLd data={buildOrganizationJsonLd()} />

      {/* Sección 1 de ux-9. Sin diapositivas en Payload, no se pinta. */}
      {diapositivas.length > 0 ? <HeroPortada diapositivas={diapositivas} /> : null}

      {/* Secciones 2 y 3 de ux-9 (fase D). Sin datos, no se pintan. */}
      <SeccionMaquinariaNueva tarjetas={tarjetasDeMarcas(marcas)} />
      <SeccionMaquinariaUsada
        pestanas={pestanasDeUsada(usados)}
        maquina={maquinaUsada ? { ...maquinaUsada, alt: "" } : null}
        hrefExcavadoras={excavadoras ? hrefDeCategoriaUsada(excavadoras.slug) : null}
      />

      {/* Secciones 4 y 5 de ux-9 (fase E). Sin datos, no se pintan. */}
      <CarruselLogos logos={logosDeMarcas(pagina.seccionLogos)} />
      <SeccionRepuestos tarjetas={tarjetasDeRepuestos(categoriasTecnicas)} />

      {/* Secciones 6, 7 y 8 de ux-9 (fase F). Sin vídeo, la tarjeta va en oscuro. */}
      <SeccionCompania
        video={videoCompania}
        youtube={videoDeYouTube(pagina.seccionCompania?.youtube)}
      />
      <SeccionCatalogo
        whatsapp={enlaceWhatsApp(contact.phone)}
        sobreVideo={videoCompania !== null}
      />

      {/* Secciones 10 y 11 de ux-9 (fase H). Sin datos publicados, no se pintan. */}
      <SeccionTestimonios tarjetas={tarjetasDeTestimonios(testimonios)} />
      <SeccionFaq
        preguntas={preguntasDeFaq(preguntas)}
        imagen={maquinaFaq ? { ...maquinaFaq, alt: "" } : null}
      />
    </main>
  );
}
