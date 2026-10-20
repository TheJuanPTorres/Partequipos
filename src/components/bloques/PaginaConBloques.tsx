import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { tieneCabecera, type VistaBloque } from "@/lib/bloques/vista";
import { buildBreadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/jsonLd";

import { DocumentoVisor } from "@/components/documentos/DocumentoVisor";

import { BloqueCabeceraVideo } from "./BloqueCabeceraVideo";
import { BloqueCifras } from "./BloqueCifras";
import { BloqueFormularioContacto, type ContextoFormulario } from "./BloqueFormularioContacto";
import { BloqueFranjaMarquee } from "./BloqueFranjaMarquee";
import { BloqueGaleria } from "./BloqueGaleria";
import { BloquePresentacionImagen } from "./BloquePresentacionImagen";
import { BloqueProcesoPasos } from "./BloqueProcesoPasos";
import { BloqueTarjetasExpandibles } from "./BloqueTarjetasExpandibles";
import { BloqueVideoYoutube } from "./BloqueVideoYoutube";
import estilos from "./paginaConBloques.module.css";

type Props = {
  /** El título de la página: es el `<h1>` si ningún bloque de cabecera lo pone. */
  titulo: string;
  migas: BreadcrumbItem[];
  bloques: VistaBloque[];
  /** Origen, Turnstile y WhatsApp del bloque «Formulario de contacto». */
  formulario: ContextoFormulario;
};

function bloque(b: VistaBloque, clave: string, formulario: ContextoFormulario) {
  switch (b.blockType) {
    case "cabeceraVideo":
      return <BloqueCabeceraVideo key={clave} {...b} />;
    case "presentacionImagen":
      return <BloquePresentacionImagen key={clave} {...b} />;
    case "cifras":
      return <BloqueCifras key={clave} {...b} />;
    case "franjaMarquee":
      return <BloqueFranjaMarquee key={clave} {...b} />;
    case "tarjetasExpandibles":
      return <BloqueTarjetasExpandibles key={clave} {...b} />;
    case "galeria":
      return <BloqueGaleria key={clave} {...b} />;
    case "videoYoutube":
      return <BloqueVideoYoutube key={clave} {...b} />;
    case "formularioContacto":
      return <BloqueFormularioContacto key={clave} {...b} contexto={formulario} />;
    case "procesoPasos":
      return <BloqueProcesoPasos key={clave} {...b} />;
    case "documentoVisor":
      return (
        <div key={clave} id={b.ancla ?? undefined} className={estilos.documento}>
          <DocumentoVisor documento={b.documento} titulo={b.titulo} />
        </div>
      );
  }
}

/**
 * UNA PÁGINA COMPUESTA CON BLOQUES: migas, JSON-LD de las migas y los bloques,
 * en un solo `<main>`. El texto enriquecido y las «secciones» de la página NO
 * se pintan (decisión de dirección; el panel lo avisa).
 *
 * UN SOLO `<h1>`: el del bloque de cabecera; si la página no tiene cabecera,
 * el título de la página.
 */
export function PaginaConBloques({ titulo, migas, bloques, formulario }: Props) {
  return (
    <main className={estilos.pagina}>
      <JsonLd data={buildBreadcrumbJsonLd(migas)} />
      {/*
       * Migas solo para lectores de pantalla: ux-9 no las pinta (decisión de
       * dirección). Su enlace sí recibe el foco, así que se muestran mientras
       * lo tiene, como el enlace de salto (WCAG 2.4.7).
       */}
      <div className={`sr-only focus-within:not-sr-only ${estilos.migas}`}>
        <Breadcrumbs items={migas} />
      </div>
      {tieneCabecera(bloques) ? null : <h1 className={estilos.titulo}>{titulo}</h1>}
      {bloques.map((b, i) => {
        const clave = b.id ?? `${b.blockType}-${i}`;
        /*
         * Con ancla, el bloque va dentro de un `<div id>`: `/pagina/#ancla`
         * lleva a él, con margen para la cabecera fija (`scroll-margin-top`).
         */
        return b.ancla ? (
          <div key={clave} id={b.ancla} className={estilos.ancla}>
            {bloque(b, clave, formulario)}
          </div>
        ) : (
          bloque(b, clave, formulario)
        );
      })}
    </main>
  );
}
