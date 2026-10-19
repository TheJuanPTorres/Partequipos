import type { Marca, ModelosRepuesto, RepuestosMarca, TiposEquipo } from "@/payload-types";

import { rutas } from "../routes";
import { imagenDeMedia } from "../utils/relations";

import { segmentoDeTipo } from "./anidado";
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
    logoOscuro: Boolean(marca.logoOscuroEnMenu),
  };
}

export type ModeloEnlace = {
  /** Clave de la lista: el id del modelo, o `entrada-<n>` para una «otra entrada». */
  id: number | string;
  nombre: string;
  /** Código de fabricante, si lo hay y el nombre no lo lleva ya: acompaña al nombre. */
  codigo: string | null;
  /** `null`: una entrada sin ficha (WordPress la nombra y no tiene página): va como texto. */
  href: string | null;
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
        href: rutas.modelo(marca.slug, segmentoDeTipo(tipo), m.slug),
        serie: texto(m.serie) || null,
      };
    });
}

/**
 * La lista de modelos con las «otras entradas» del tipo (decisión del cliente,
 * 2026-10-17: la lista de WordPress, tal cual): un modelo sin página propia va
 * como texto, y uno que enlaza a otra ficha («EX450LC-5» → la ZX450LC-5), con
 * el texto de WordPress. Sin otras entradas, la lista de siempre, sin tocar su
 * orden; con ellas, todo por orden alfabético (con los números en su orden).
 * `hrefDeModelo` da la URL de la ficha enlazada, o `null` si ya no existe.
 */
export function conOtrasEntradas(
  tipo: TiposEquipo,
  modelos: ModeloEnlace[],
  hrefDeModelo: (id: number) => string | null,
): ModeloEnlace[] {
  const otras: ModeloEnlace[] = (tipo.otrasEntradas ?? []).flatMap((e, i) => {
    const nombre = texto(e.texto);
    if (!nombre) return [];
    const id = typeof e.modelo === "number" ? e.modelo : (e.modelo?.id ?? null);
    return [
      {
        id: `entrada-${i}`,
        nombre,
        codigo: null,
        href: id === null ? null : hrefDeModelo(id),
        serie: texto(e.serie) || null,
      },
    ];
  });
  if (otras.length === 0) return modelos;
  return [...modelos, ...otras].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { numeric: true, sensitivity: "base" }),
  );
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
