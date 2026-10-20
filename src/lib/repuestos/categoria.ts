import type { CategoriasTecnica, Marca, RepuestosMarca } from "@/payload-types";

import { colorDeMarca, logoBlancoSobre } from "../marca/colorMarca";
import { rutas } from "../routes";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

import type { VistaEncabezado } from "./marca";

/**
 * Lógica pura de las páginas de categoría técnica, de los índices (marcas y
 * categorías) y de la principal de repuestos. PROVISIONAL hasta el diseño de
 * Andrés (docs/diseno/decisiones-repuestos-marca.md §7): el mismo lenguaje
 * visual que las páginas de marca y de tipo.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/**
 * Foto de fondo de los encabezados que no tienen una propia: la primera que
 * tenga una marca. Sin ninguna, el encabezado queda en el tono oscuro del velo.
 */
export function fondoDeRespaldo(marcas: Marca[]): ImagenLista | null {
  for (const marca of marcas) {
    const fondo = imagenDeMedia(marca.fondoHero, "");
    if (fondo) return fondo;
  }
  return null;
}

/**
 * Encabezado de una categoría: «Repuestos para maquinaria pesada» y
 * «<CATEGORÍA> En Colombia» (como el de la marca), con su descripción. El fondo
 * es la imagen de la categoría o, si no la tiene, el de respaldo; sin logo.
 */
export function vistaEncabezadoCategoria(
  categoria: CategoriasTecnica,
  global: RepuestosMarca,
  respaldo: ImagenLista | null,
): VistaEncabezado {
  const sufijo = texto(global.subtituloHero);
  return {
    linea1: texto(global.tituloHero) || "Repuestos para maquinaria pesada",
    linea2: [categoria.nombre.trim().toUpperCase(), sufijo].filter(Boolean).join(" "),
    descripcion: texto(categoria.descripcion),
    fondo: imagenDeMedia(categoria.imagen, "") ?? respaldo,
    logo: null,
  };
}

/** Encabezado de un índice (marcas, categorías o la principal de repuestos). */
export function vistaEncabezadoIndice(
  linea1: string,
  linea2: string,
  descripcion: string,
  respaldo: ImagenLista | null,
): VistaEncabezado {
  return { linea1, linea2, descripcion, fondo: respaldo, logo: null };
}

export type PlacaMarca = {
  id: number;
  nombre: string;
  href: string;
  /** Los logos del cliente son blancos: van sobre una placa oscura (D10). */
  logo: ImagenLista | null;
  /** «Color de la marca» válido (`#rrggbb`), o `null`: la baldosa del índice va en amarillo. */
  color: string | null;
  /** El logo va en blanco sobre su color (en negro si el color es muy claro), como en el #271. */
  logoBlanco: boolean;
};

/** Una placa por marca, con su enlace a la página de la marca. */
export function placasDeMarcas(marcas: Marca[]): PlacaMarca[] {
  return marcas
    .filter((m) => m.nombre?.trim() && m.slug?.trim())
    .map((m) => ({
      id: m.id,
      nombre: m.nombre.trim(),
      href: rutas.marca(m.slug),
      logo: imagenDeMedia(m.logo, m.nombre.trim()),
      color: colorDeMarca(m.colorMarca),
      logoBlanco: logoBlancoSobre(m.colorMarca),
    }));
}
