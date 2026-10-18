import type { Marca, ModelosRepuesto, RepuestosMarca, TiposEquipo } from "@/payload-types";

import { rutas } from "../routes";
import { imagenDeMedia } from "../utils/relations";

import type { VistaEncabezado } from "./marca";
import { agruparPorSerie, seriesDeTipo, type GrupoDeModelos } from "./series";

/**
 * Lógica pura de la página de TIPO de repuestos (PROVISIONAL hasta el diseño
 * de Andrés, docs/diseno/decisiones-repuestos-marca.md §6): el mismo lenguaje
 * visual que la página de marca, con los modelos del tipo como enlaces.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/**
 * Encabezado del tipo: «Repuestos para <tipo>» y «<MARCA> En Colombia». El
 * fondo es el de la marca (una foto de obra a todo el ancho); si no lo tiene,
 * la imagen del propio tipo. El logo, el de la marca.
 */
export function vistaEncabezadoTipo(
  marca: Marca,
  tipo: TiposEquipo,
  global: RepuestosMarca,
): VistaEncabezado {
  const nombre = marca.nombre.trim();
  const sufijo = texto(global.subtituloHero);
  return {
    linea1: `Repuestos para ${tipo.nombre.trim().toLowerCase()}`,
    linea2: [nombre.toUpperCase(), sufijo].filter(Boolean).join(" "),
    descripcion: texto(tipo.descripcion),
    fondo: imagenDeMedia(marca.fondoHero, "") ?? imagenDeMedia(tipo.imagen, ""),
    logo: imagenDeMedia(marca.logo, `Logo de ${nombre}`),
  };
}

export type ModeloEnlace = {
  id: number;
  nombre: string;
  /** Código de fabricante, si lo hay y el nombre no lo lleva ya: acompaña al nombre. */
  codigo: string | null;
  href: string;
  /** La serie que eligió el editor (solo cuenta si el tipo tiene series). */
  serie: string | null;
};

/** Un enlace por modelo, a su ficha. Uno sin nombre o sin slug no sale. */
export function enlacesDeModelos(
  marca: Marca,
  tipo: TiposEquipo,
  modelos: ModelosRepuesto[],
): ModeloEnlace[] {
  return modelos
    .filter((m) => m.nombre?.trim() && m.slug?.trim())
    .map((m) => {
      const nombre = m.nombre.trim();
      const codigo = texto(m.codigo);
      return {
        id: m.id,
        nombre,
        // Un código que el nombre ya lleva («Excavadora CATERPILLAR 311» y «311») no se repite.
        codigo: codigo && !nombre.toLowerCase().includes(codigo.toLowerCase()) ? codigo : null,
        href: rutas.modelo(marca.slug, tipo.slug, m.slug),
        serie: texto(m.serie) || null,
      };
    });
}

/**
 * Los modelos agrupados por la serie de su tipo (Hitachi: «Serie EX», «Serie
 * ZAXIS» y, al final, «Otros modelos»). `null` si el tipo no tiene series.
 */
export function gruposDeModelos(
  tipo: TiposEquipo,
  modelos: ModeloEnlace[],
): GrupoDeModelos<ModeloEnlace>[] | null {
  return agruparPorSerie(seriesDeTipo(tipo), modelos, (m) => m.serie);
}
