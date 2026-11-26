import type { CategoriasTecnica, Marca, RepuestosMarca } from "@/payload-types";
import RECORTES_PIEZAS from "@/lib/marca/recortesPiezas.json";
import type { Recorte } from "@/lib/marca/tamanoOptico";

import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

import type { TarjetaMarca } from "./marca";

/**
 * PLANTILLA DE ANDRÉS para las páginas de marca y de tipo de repuestos («Ficha de repuesto»,
 * Elementor 3923; 2026-10-19). Lógica pura de las piezas nuevas: las categorías como tarjetas con
 * foto y «¿Por qué elegirnos?».
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/**
 * La parte visible de una foto de pieza ya medida (`scripts/marca/recortes-piezas.mjs`); sin ella, se
 * mide al pintar. La clave es el nombre del fichero SIN el sufijo aleatorio del Blob: cada entorno sube
 * su propia copia de la misma foto.
 */
function recorteConocido(url: string) {
  try {
    return (
      (RECORTES_PIEZAS as Record<string, Recorte>)[
        new URL(url).pathname.replace(/-[A-Za-z0-9]{20,}(?=\.\w+$)/, "")
      ] ?? null
    );
  } catch {
    return null;
  }
}

/**
 * Las categorías técnicas como tarjetas con su foto y «Ver todo», en el orden del panel
 * (el que el editor arrastró: la consulta ya las trae así, 2026-11-19). Una categoría sin nombre o sin página no sale
 * (no hay enlace al que ir); sin foto, la tarjeta se pinta solo con el panel.
 */
export function tarjetasDeCategorias(categorias: CategoriasTecnica[]): TarjetaMarca[] {
  return categorias
    .filter((c) => texto(c.nombre) && texto(c.slug))
    .map((c) => {
      const imagen = imagenDeMedia(c.imagen, "");
      return {
        clave: `categoria-${c.id}`,
        titulo: texto(c.nombre),
        href: rutas.categoriaRepuestos(texto(c.slug)),
        imagen,
        // La foto de la pieza, entera y al mismo tamaño a la vista que las demás.
        pieza: imagen
          ? {
              url: imagen.url,
              width: imagen.width,
              height: imagen.height,
              oscuro: false,
              recorte: recorteConocido(imagen.url),
            }
          : undefined,
        soloEscritorio: false,
        enlaceTienda: c.enlaceTienda ?? null,
      };
    });
}

export type VistaPorQue = {
  titulo: string;
  /** Sin foto (la página de aditamentos, 2026-10-20): el texto ocupa toda la tarjeta. */
  imagen: ImagenLista | null;
  /** Frase en negrita antes de los puntos (el «Nuestro compromiso…» de aditamentos). */
  entradilla?: string;
  /** Párrafo tras la entradilla. */
  texto?: string;
  /** Frase destacada tras el texto, con su complemento (el «Nuestro compromiso…» de Filtros Donaldson). */
  compromiso?: { titulo: string; texto: string };
  puntos: { clave: string; titulo: string; texto: string }[];
  cierre: string;
  boton: string;
};

/**
 * «¿Por qué elegirnos?»: sin título NO se pinta, y sin foto tampoco (dirección, 2026-10-19: hasta
 * que el cliente mande una propia no se publica el bloque con un fondo vacío). La frase de cierre lleva «{marca}», que se
 * sustituye por el nombre de la marca de la página. Un punto sin título o sin texto no sale.
 *
 * Sin marca (`null`: las páginas de categoría técnica, 2026-10-22), una frase de cierre con
 * «{marca}» no sale: quedaría coja.
 */
export function vistaPorQue(
  global: RepuestosMarca,
  marca: Pick<Marca, "nombre"> | null,
): VistaPorQue | null {
  const titulo = texto(global.porQueTitulo);
  const imagen = imagenDeMedia(global.porQueImagen, "");
  if (!titulo || !imagen) return null;
  return {
    titulo,
    imagen,
    puntos: (global.porQuePuntos ?? []).flatMap((p, i) =>
      texto(p.titulo) && texto(p.texto)
        ? [{ clave: p.id ?? `p${i}`, titulo: texto(p.titulo), texto: texto(p.texto) }]
        : [],
    ),
    cierre: cierreDe(texto(global.porQueCierre), marca),
    boton: texto(global.porQueBoton),
  };
}

function cierreDe(cierre: string, marca: Pick<Marca, "nombre"> | null): string {
  if (!cierre.includes("{marca}")) return cierre;
  return marca ? cierre.replaceAll("{marca}", texto(marca.nombre)) : "";
}
