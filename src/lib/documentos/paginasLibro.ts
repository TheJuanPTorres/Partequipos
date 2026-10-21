import { getImageProps } from "next/image";

import type { PaginaLibro } from "@/components/documentos/VisorLibro";

import type { PaginaVisor } from "./visor";

/*
 * Anchos que pide cada imagen: en el libro abierto cada página ocupa la mitad
 * del visor (que no pasa de 1120 px), en móvil todo el ancho; con zoom, el doble.
 */
const SIZES_PAGINA = "(max-width: 640px) 100vw, 560px";
const SIZES_ZOOM = "(max-width: 640px) 200vw, 1120px";
/** Las miniaturas, a ancho fijo: `getImageProps` da la de 1x y 2x. */
const ANCHO_MINIATURA = 64;

/**
 * Las páginas de un documento, como las pinta el visor tipo libro: cada URL
 * sale del optimizador (`getImageProps`), así el visor pide la página al ancho
 * que se pinta. Sirve en el servidor (bloque «Documento en visor») y en el
 * navegador (la ficha de maquinaria nueva lo calcula al abrir su ventana, para
 * no llevar los `srcset` de todas las páginas en el HTML).
 */
export function paginasDelLibro(paginas: PaginaVisor[]): PaginaLibro[] {
  return paginas.map((p) => {
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
}
