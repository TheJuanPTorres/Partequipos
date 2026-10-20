import type { CategoriasTecnica, Marca, RepuestosMarca } from "@/payload-types";

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
 * Las categorías técnicas como tarjetas con su foto y «Ver todo», en el orden de la marca
 * (primero las de `ordenMarca`, luego por nombre). Una categoría sin nombre o sin página no sale
 * (no hay enlace al que ir); sin foto, la tarjeta se pinta solo con el panel.
 */
export function tarjetasDeCategorias(categorias: CategoriasTecnica[]): TarjetaMarca[] {
  return categorias
    .filter((c) => texto(c.nombre) && texto(c.slug))
    .sort((a, b) => {
      const oa = typeof a.ordenMarca === "number" ? a.ordenMarca : Infinity;
      const ob = typeof b.ordenMarca === "number" ? b.ordenMarca : Infinity;
      if (oa !== ob) return oa < ob ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, "es");
    })
    .map((c) => ({
      clave: `categoria-${c.id}`,
      titulo: texto(c.nombre),
      href: rutas.categoriaRepuestos(texto(c.slug)),
      imagen: imagenDeMedia(c.imagen, ""),
      soloEscritorio: false,
    }));
}

export type VistaPorQue = {
  titulo: string;
  /** Sin foto (la página de aditamentos, 2026-10-20): el texto ocupa toda la tarjeta. */
  imagen: ImagenLista | null;
  /** Frase en negrita antes de los puntos (el «Nuestro compromiso…» de aditamentos). */
  entradilla?: string;
  /** Párrafo tras la entradilla. */
  texto?: string;
  puntos: { clave: string; titulo: string; texto: string }[];
  cierre: string;
  boton: string;
};

/**
 * «¿Por qué elegirnos?»: sin título NO se pinta, y sin foto tampoco (dirección, 2026-10-19: hasta
 * que el cliente mande una propia no se publica el bloque con un fondo vacío). La frase de cierre lleva «{marca}», que se
 * sustituye por el nombre de la marca de la página. Un punto sin título o sin texto no sale.
 */
export function vistaPorQue(global: RepuestosMarca, marca: Marca): VistaPorQue | null {
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
    cierre: texto(global.porQueCierre).replaceAll("{marca}", texto(marca.nombre)),
    boton: texto(global.porQueBoton),
  };
}
