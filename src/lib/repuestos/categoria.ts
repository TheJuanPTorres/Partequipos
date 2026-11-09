import type { CategoriasTecnica, Marca, RepuestosMarca } from "@/payload-types";

import { logoPropio, type LogoMarca } from "../marca/logoMarca";
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
 * Encabezado de una categoría: «Repuestos para maquinaria pesada» y «<CATEGORÍA>», sin la
 * segunda línea de la marca («En Colombia»: Juan Pablo, 2026-11-08), con su descripción. El fondo
 * es su «Fondo del encabezado»; vacío, la imagen de su tarjeta, y sin ella, el de
 * respaldo (2026-10-20); sin logo.
 */
export function vistaEncabezadoCategoria(
  categoria: CategoriasTecnica,
  global: RepuestosMarca,
  respaldo: ImagenLista | null,
): VistaEncabezado {
  return {
    linea1: texto(global.tituloHero) || "Repuestos para maquinaria pesada",
    linea2: categoria.nombre.trim().toUpperCase(),
    descripcion: texto(categoria.descripcion),
    fondo:
      imagenDeMedia(categoria.fondoHero, "") ?? imagenDeMedia(categoria.imagen, "") ?? respaldo,
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
  /** El logo de la marca (`LogoMarca`), sobre fondo blanco. */
  logo: LogoMarca | null;
  /** `href` es OTRO sitio (marca de nueva sin página propia, LiuGong): pestaña nueva. */
  externo?: true;
  /** «Color de la baldosa» y «Logo para la baldosa» (`BaldosasColorMarcas`, solo repuestos). */
  color?: string | null;
  logoSobreColor?: LogoMarca | null;
};

/** Una placa por marca, con su enlace a la página de la marca. */
export function placasDeMarcas(marcas: Marca[]): PlacaMarca[] {
  return marcas
    .filter((m) => m.nombre?.trim() && m.slug?.trim())
    .map((m) => ({
      id: m.id,
      nombre: m.nombre.trim(),
      href: rutas.marca(m.slug),
      logo: logoPropio(m),
      color: m.colorBaldosa ?? null,
      // Su logo tal cual: el de la baldosa no se pinta en oscuro (`logoOscuroEnMenu` es del menú).
      logoSobreColor: logoPropio({ logo: m.logoBaldosa }),
    }));
}
