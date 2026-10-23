import type { CSSProperties } from "react";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";

import { colorDeMarca, COLOR_SIN_MARCA, tintaDeLogoSobre } from "./colorMarca";

/**
 * LA FRANJA DE MARCA CON MÁS FUERZA (dirección, 2026-10-23; `FranjaMarca`): las páginas
 * generales de tipo de nueva y «Otros {tipo}» de la ficha nueva. Cada mejora es
 * INDEPENDIENTE y este objeto es su interruptor: una en `false` desaparece del todo. En un
 * preview se prueban con `?anim=D1,D3` (`?anim=no`, ninguna), con las utilidades del listado de
 * usados (#320, `activasDe` y `ZonaAnimada`); en el sitio publicado el parámetro no hace nada.
 *
 * - D1: fondo del color de la marca en degradado suave hacia un tono más oscuro; logo y título
 *   en blanco o negro (`tintaDeLogoSobre`, 3:1), y el título más grande y con más peso.
 * - D2: textura industrial sutil a la derecha (diagonales de franja de seguridad) en un tono
 *   del mismo color.
 * - D3: la foto de una máquina de la marca asomando por el borde derecho, fundida con el fondo.
 * - D4: «N modelos» y «Ver la marca →» a su página.
 * - D5: entrada con un barrido del color de izquierda a derecha y el logo deslizándose.
 *
 * Todas: sin CLS (la foto va dentro de la caja de la franja, y la entrada solo mueve
 * `transform` y `opacity`), apagadas con «reducir movimiento» las que se mueven y, sin
 * JavaScript, la franja se ve entera.
 */
export const MEJORAS_FRANJA = {
  D1: true,
  D2: true,
  D3: true,
  D4: true,
  D5: true,
} as const satisfies Record<string, boolean>;

/** Contraste del texto pequeño (D4, «N modelos») con TODO el degradado: AA de texto normal. */
export const CONTRASTE_TEXTO = 4.5;

const BLANCO = "#ffffff";

const luz = (hex: string) => {
  const [r, g, b] = rgbDeHex(hex) ?? [0, 0, 0];
  return luminancia(r, g, b);
};

/** El color mezclado con negro en la proporción `k` (0 = el mismo; 1 = negro), en `#rrggbb`. */
export function oscurecer(hex: string, k: number): string {
  const [r, g, b] = rgbDeHex(hex) ?? [0, 0, 0];
  return `#${[r, g, b]
    .map((c) =>
      Math.round(c * (1 - k))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export type ColoresFranja = {
  /** Inicio del degradado (izquierda): el color de la marca, o uno algo más oscuro si hace falta. */
  inicio: string;
  /** Fin del degradado (derecha): más oscuro. */
  fin: string;
  /** Blanco o negro: logo, título y textos. */
  tinta: string;
};

/**
 * Los colores de la franja (D1). La tinta es la del logo de la barra de marcas
 * (`tintaDeLogoSobre`: blanco si se lee con 3:1, negro solo en los claros). Para que el texto
 * pequeño (D4) cumpla AA en todo el degradado:
 * - con tinta blanca, el inicio se oscurece lo justo para llegar a 4,5:1 (Yanmar, 4,38 de
 *   origen) y el fin, un 30 % más (oscurecer con blanco encima solo sube el contraste);
 * - con tinta negra, el color ya da más de 7:1 con el negro (si da menos de 3:1 con el blanco,
 *   da más de 7:1 con el negro), y el fin se oscurece lo más posible, hasta un 25 %, sin bajar
 *   de 5:1 (margen para las diagonales de D2).
 * Sin color de marca, el naranja de la barra de series.
 */
export function coloresFranja(valor: string | null | undefined): ColoresFranja {
  const color = colorDeMarca(valor) ?? COLOR_SIN_MARCA;
  const tinta = tintaDeLogoSobre(color);
  const lt = luz(tinta);
  const con = (hex: string) => contraste(lt, luz(hex));
  if (tinta === BLANCO) {
    let k = 0;
    while (con(oscurecer(color, k)) < CONTRASTE_TEXTO && k < 1)
      k = Math.round((k + 0.02) * 100) / 100;
    const inicio = oscurecer(color, k);
    return { inicio, fin: oscurecer(color, Math.min(1, k + 0.3)), tinta };
  }
  let k = 0.25;
  while (k > 0 && con(oscurecer(color, k)) < 5) k = Math.round((k - 0.01) * 100) / 100;
  return { inicio: color, fin: oscurecer(color, k), tinta };
}

/** Las variables CSS de la franja (las usan D1, D2 y D3). */
export function estiloFranja(valor: string | null | undefined): CSSProperties {
  const { inicio, fin, tinta } = coloresFranja(valor);
  return {
    "--franja-inicio": inicio,
    "--franja-fin": fin,
    "--franja-tinta": tinta,
  } as CSSProperties;
}

/** «1 modelo», «3 modelos». */
export function textoModelos(n: number): string {
  return `${n} ${n === 1 ? "modelo" : "modelos"}`;
}
