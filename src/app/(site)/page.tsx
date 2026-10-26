import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HeroPortada } from "@/components/hero/HeroPortada";
import { SeccionMaquinariaNueva } from "@/components/portada/SeccionMaquinariaNueva";
import { SeccionMarcasKit } from "@/components/portada/kit/SeccionMarcasKit";
import { SeccionRepuestosKit } from "@/components/portada/kit/SeccionRepuestosKit";
import { SeccionUsadosKit } from "@/components/portada/kit/SeccionUsadosKit";
import { SeccionCatalogo } from "@/components/portada/SeccionCatalogo";
import { SeccionCompania, SeccionTestimonios } from "@/components/portada/diferidos";
import { SeccionFaq } from "@/components/portada/SeccionFaq";
import { SeccionSedes } from "@/components/portada/SeccionSedes";
import { JsonLd } from "@/components/seo/JsonLd";
import { enlaceWhatsApp } from "@/lib/navegacion";
import { diapositivasDeHero } from "@/lib/portada/hero";
import {
  categoriasDePortada,
  filtrosDeUsados,
  imagenDecorativa,
  logosDeLaBanda,
} from "@/lib/portada/kitCliente";
import { RUTA_USADA, tarjetasDeMarcas } from "@/lib/portada/secciones";
import { videoDeCompania, videoDeYouTube } from "@/lib/portada/seccionesF";
import { preguntasDeFaq, tarjetasDeTestimonios } from "@/lib/portada/seccionesH";
import { sedesDePortada, tokenMapbox } from "@/lib/portada/sedes";
import { getCategoriasTecnicasDePortada } from "@/lib/queries/getCategoriasTecnicas";
import { getPreguntasDePortada, getTestimoniosDePortada } from "@/lib/queries/getPortadaH";
import { getVideoPorId } from "@/lib/queries/getVideos";
import { getMarcasDePortada, getUsadosDePortada } from "@/lib/queries/getMaquinaria";
import { SLUG_PORTADA, getPaginaPorSlug } from "@/lib/queries/getPaginas";
import { getEmpresa, getHorario, getLogo } from "@/lib/queries/getSeo";
import { getSedesDePortada } from "@/lib/queries/getSedes";
import { getLogosMarca } from "@/lib/queries/getLogosMarca";
import { metadataDe } from "@/lib/seo/metadata";
import { turnstileSiteKey } from "@/lib/turnstile";
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
    categoriasTecnicas,
    testimonios,
    preguntas,
    horario,
    sedes,
    empresa,
    logo,
    logosMarca,
  ] = await Promise.all([
    getMarcasDePortada(),
    getUsadosDePortada(),
    getCategoriasTecnicasDePortada(),
    getTestimoniosDePortada(),
    getPreguntasDePortada(),
    getHorario(),
    getSedesDePortada(),
    getEmpresa(),
    getLogo(),
    getLogosMarca(),
  ]);
  const maquinaFaq = imagenDeMedia(pagina.seccionFaq?.imagen, "");
  const relVideo = pagina.seccionCompania?.video;
  const idVideo = typeof relVideo === "object" && relVideo ? relVideo.id : relVideo;
  const videoCompania = videoDeCompania({
    video: idVideo ? await getVideoPorId(idVideo) : null,
  });
  // Sin vídeo, la foto de fondo de la sección (decorativa: el texto va encima).
  const imagenCompania = videoCompania ? null : imagenDeMedia(pagina.seccionCompania?.imagen, "");

  return (
    /*
     * Un solo <main> con las secciones de ux-9 (fase 6). El bloque previo al
     * diseño («Qué encontrarás aquí», «Sobre Partequipos» y contacto) se quitó:
     * sus enlaces están en la cabecera, las secciones y el pie
     * (docs/diseno/decisiones-home-ux9.md §22).
     */
    <main>
      {/*
       * El `<h1>` de la portada (auditoría de C, I1, 2026-10-06): descriptivo
       * y oculto a la vista, porque el diseño no pinta ningún título así. Sale
       * del campo «Título» de la página «inicio» del panel. El carrusel sigue
       * con sus `<h2>`.
       */}
      <h1 className="sr-only">{pagina.titulo}</h1>
      <JsonLd data={buildOrganizationJsonLd(horario, empresa, logo.buscadores)} />

      {/* Sección 1 de ux-9. Sin diapositivas en Payload, no se pinta. */}
      {diapositivas.length > 0 ? <HeroPortada diapositivas={diapositivas} /> : null}

      {/* Secciones 2 y 3 de ux-9 (fase D). Sin datos, no se pintan. */}
      <SeccionMaquinariaNueva
        tarjetas={tarjetasDeMarcas(marcas, logosMarca)}
        textos={{
          antetitulo: tx(nueva?.antetitulo),
          titulo: tx(nueva?.titulo),
          botonTexto: tx(nueva?.botonTexto),
          botonEnlace: tx(nueva?.botonEnlace),
        }}
      />
      {/*
       * Las tres secciones con el DISEÑO DEL CLIENTE (2026-10-26, `components/portada/kit/`):
       * «Maquinaria pesada usada», marcas (sustituye al carrusel de logos de ux-9) y «Venta de
       * repuestos». Datos e imágenes, del panel.
       */}
      <SeccionUsadosKit
        filtros={filtrosDeUsados(usados, usada)}
        maquina={imagenDecorativa(usada?.imagen)}
        hrefVerTodo={RUTA_USADA}
        cotizar={{ siteKey: turnstileSiteKey(), telefono: empresa.whatsapp }}
        textos={{
          antetitulo: tx(usada?.antetitulo),
          titulo: tx(usada?.titulo),
          descripcion: tx(usada?.descripcion),
          botonTexto: tx(usada?.botonTexto),
        }}
      />
      <SeccionMarcasKit
        logos={logosDeLaBanda(pagina.seccionLogos, logosMarca)}
        titulo={tx(pagina.seccionLogos?.titulo)}
        resaltado={tx(pagina.seccionLogos?.tituloResaltado)}
        maquina={imagenDecorativa(pagina.seccionLogos?.maquina)}
        reflejo={imagenDecorativa(pagina.seccionLogos?.maquinaReflejo)}
      />
      <SeccionRepuestosKit
        categorias={categoriasDePortada(categoriasTecnicas)}
        maquina={imagenDecorativa(repuestos?.maquina)}
        reflejo={imagenDecorativa(repuestos?.maquinaReflejo)}
        textos={{
          antetitulo: tx(repuestos?.antetitulo),
          titulo: tx(repuestos?.titulo),
          verTodos: tx(repuestos?.verMasTexto),
        }}
      />

      {/* Secciones 6, 7 y 8 de ux-9 (fase F). Sin vídeo, la tarjeta va en oscuro. */}
      {/*
       * Contenedor sin estilos, a propósito (2026-10-20): es el bloque contenedor
       * del `sticky` de la llamada (sección 8, `catalogo.module.css`). Con el
       * `<main>` como contenedor, la llamada podía pegarse al pie de la ventana
       * en CUALQUIER punto de la portada, y si su estado se quedaba en «visible»
       * (un salto de scroll hacia arriba sin cruzar «Nuestra Compañía», que el
       * IntersectionObserver no ve) su título se pintaba encima de «Maquinaria
       * pesada usada». Aquí dentro solo se pega mientras dura su propio recorrido.
       */}
      <div>
        <SeccionCompania
          video={videoCompania}
          imagen={imagenCompania}
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
      </div>

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
