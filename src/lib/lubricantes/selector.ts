import type { CategoriasTecnica, MarcasLubricante } from "@/payload-types";

import { colorDeMarca, tintaSobre } from "../marca/colorMarca";
import { conAlt, logoPropio, type LogoConAlt } from "../marca/logoMarca";
import { rutas } from "../routes";
import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";
import { enlaceExternoLubricante, tienePaginaPropiaLubricante, webDeLubricante } from "./destino";
import { paisDe, type CodigoPais } from "./pais";

/**
 * SELECTOR DE MARCAS de la categoría técnica «Lubricantes» (2026-11-04, dirección): en lugar de
 * listar productos, un panel por marca de lubricantes, del color de la marca, con su logo en placa
 * blanca, su bandera, su foto teñida con su color y su botón:
 *
 * - con página aquí (Eni): «Ver productos» → su página o, con «Enlace externo», a esa web en otra
 *   pestaña (2026-11-08);
 * - de «Otra web» con enlace (Dispel): «Ir a su web» → su enlace, en otra pestaña;
 * - de «Otra web» sin enlace: «Ver productos» → la portada, en la misma pestaña (2026-11-09,
 *   provisional hasta que tenga productos).
 *
 * Se enciende con la casilla «Mostrar el selector de marcas» de la categoría
 * (`selectorMarcas.activo`); las marcas, las elegidas en su orden o, vacío, todas (primero las de
 * página propia).
 */

export const TITULO_SELECTOR = "Elige tu marca de lubricantes";

/** Sin «Color principal» en el panel, un gris oscuro neutro (el texto va en blanco). */
export const COLOR_SIN_COLOR = "#33373d";

export type AccionSelector =
  | { tipo: "pagina"; href: string; texto: "Ver productos" }
  | { tipo: "externo"; href: string; texto: "Ir a su web" | "Ver productos" };

export type PanelSelector = {
  id: number;
  nombre: string;
  color: string;
  /** Negro o blanco, la que mejor se lea sobre el color (AA). */
  tinta: string;
  logo: LogoConAlt | null;
  pais: { codigo: CodigoPais; nombre: string } | null;
  texto: string;
  foto: ImagenLista | null;
  accion: AccionSelector;
};

export type VistaSelector = { titulo: string; paneles: PanelSelector[] };

type MarcaSelector = Pick<
  MarcasLubricante,
  | "id"
  | "nombre"
  | "slug"
  | "logo"
  | "colorPrincipal"
  | "destino"
  | "enlaceExterno"
  | "paisOrigen"
  | "fotoSelector"
  | "textoSelector"
  | "entradilla"
  | "imagenCabecera"
>;

const limpio = (v: string | null | undefined) => v?.trim() ?? "";

/** La primera frase de un texto (hasta el primer punto seguido de espacio o el final). */
export function primeraFrase(texto: string | null | undefined): string {
  const t = limpio(texto).replace(/\s+/g, " ");
  const fin = t.search(/[.!?](\s|$)/);
  return fin === -1 ? t : t.slice(0, fin + 1);
}

export function accionDe(m: MarcaSelector): AccionSelector {
  if (tienePaginaPropiaLubricante(m)) {
    const web = webDeLubricante(m);
    if (web) return { tipo: "externo", href: web, texto: "Ver productos" };
    return { tipo: "pagina", href: `${rutas.marcaLubricante(m.slug)}/`, texto: "Ver productos" };
  }
  const externo = enlaceExternoLubricante(m);
  return externo
    ? { tipo: "externo", href: externo, texto: "Ir a su web" }
    : { tipo: "pagina", href: "/", texto: "Ver productos" };
}

export function panelDe(m: MarcaSelector): PanelSelector {
  const color = colorDeMarca(m.colorPrincipal) ?? COLOR_SIN_COLOR;
  return {
    id: m.id,
    nombre: limpio(m.nombre),
    color,
    tinta: tintaSobre(color),
    logo: conAlt(logoPropio({ logo: m.logo }), `Logo de ${limpio(m.nombre)}`),
    pais: paisDe(m.paisOrigen),
    texto: limpio(m.textoSelector) || primeraFrase(m.entradilla),
    foto: imagenDeMedia(m.fotoSelector, "") ?? imagenDeMedia(m.imagenCabecera, ""),
    accion: accionDe(m),
  };
}

/**
 * La vista del selector, o `null` si la categoría no lo tiene encendido (o no hay ninguna marca:
 * entonces la página sigue con «Qué incluye»).
 */
export function vistaSelector(
  categoria: Pick<CategoriasTecnica, "selectorMarcas">,
  todas: readonly MarcaSelector[],
): VistaSelector | null {
  const grupo = categoria.selectorMarcas;
  if (!grupo?.activo) return null;
  const elegidas = (grupo.marcas ?? [])
    .map((r) => {
      const id = typeof r === "object" ? r?.id : r;
      return todas.find((m) => m.id === id) ?? poblado<MarcaSelector>(r);
    })
    .filter((m): m is MarcaSelector => !!m);
  const marcas = (
    elegidas.length > 0
      ? elegidas
      : [...todas].sort(
          (a, b) =>
            Number(tienePaginaPropiaLubricante(b)) - Number(tienePaginaPropiaLubricante(a)) ||
            a.nombre.localeCompare(b.nombre, "es"),
        )
  ).filter((m) => limpio(m.nombre) && limpio(m.slug));
  if (marcas.length === 0) return null;
  return { titulo: limpio(grupo.titulo) || TITULO_SELECTOR, paneles: marcas.map(panelDe) };
}
