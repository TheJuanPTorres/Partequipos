import { getImageProps } from "next/image";

import { vistaDeDocumento } from "@/lib/documentos/visor";
import { getDocumentoParaVisor } from "@/lib/queries/getDocumentos";

import { VisorLibro, type PaginaLibro } from "./VisorLibro";
import estilos from "./visorLibro.module.css";

/*
 * Anchos que pide cada imagen: en el libro abierto cada página ocupa la mitad
 * del visor (que no pasa de 960 px), en móvil todo el ancho; con zoom, el doble.
 */
const SIZES_PAGINA = "(max-width: 640px) 100vw, 480px";
const SIZES_ZOOM = "(max-width: 640px) 200vw, 960px";
/** Las miniaturas, a ancho fijo: `getImageProps` da la de 1x y 2x. */
const ANCHO_MINIATURA = 64;

/**
 * «DOCUMENTO EN VISOR» (2026-10-20): un PDF de «Documentos» como libro. Lo usan
 * el bloque de página y el bloque dentro del texto enriquecido; los dos solo
 * saben el id del documento, así que se pide aquí con sus páginas.
 *
 * Sin «Páginas como imágenes», el enlace de descarga solo, nunca un hueco.
 * Las URL de las imágenes salen del optimizador (`getImageProps`): el visor
 * pide la página al ancho que se pinta.
 */
export async function DocumentoVisor({
  documento,
  titulo,
}: {
  documento: number | { id: number } | null | undefined;
  titulo?: string | null;
}) {
  const id = typeof documento === "object" ? documento?.id : documento;
  if (!id) return null;
  const vista = vistaDeDocumento(await getDocumentoParaVisor(id), titulo);
  if (!vista) return null;

  if (vista.paginas.length === 0) {
    return (
      <p className={estilos.soloEnlace}>
        <a href={vista.pdf.url} className={estilos.descargar} rel="noopener noreferrer">
          Descargar PDF: {vista.titulo}
          {vista.pdf.tamano ? (
            <span className={estilos.tamano}> (PDF, {vista.pdf.tamano})</span>
          ) : null}
        </a>
      </p>
    );
  }

  const paginas: PaginaLibro[] = vista.paginas.map((p) => {
    const base = { src: p.url, width: p.width, height: p.height, alt: p.alt };
    const { props: pagina } = getImageProps({ ...base, sizes: SIZES_PAGINA });
    const { props: zoom } = getImageProps({ ...base, sizes: SIZES_ZOOM });
    const { props: miniatura } = getImageProps({
      src: p.url,
      alt: "",
      width: ANCHO_MINIATURA,
      height: Math.round((ANCHO_MINIATURA * p.height) / p.width),
    });
    return {
      alt: p.alt,
      width: p.width,
      height: p.height,
      src: pagina.src,
      srcSet: pagina.srcSet,
      sizes: SIZES_PAGINA,
      zoomSrcSet: zoom.srcSet,
      zoomSizes: SIZES_ZOOM,
      miniatura: miniatura.src,
    };
  });

  return <VisorLibro titulo={vista.titulo} pdf={vista.pdf} paginas={paginas} />;
}
