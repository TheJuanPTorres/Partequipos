import type { MarcasMaquinaria } from "@/payload-types";

import { COLOR_SIN_MARCA, colorDeMarca, tintaDeLogoSobre, tintaSobre } from "../marca/colorMarca";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * Lógica pura del BANNER DE MARCA de la página general de un tipo de maquinaria nueva
 * (2026-10-26, prototipo del cliente «Excavadoras nuevas» portado): el logo sobre una forma del
 * color de la marca con borde diagonal, el título sobre un tono claro de ese color y, a la
 * derecha, la foto de la marca teñida con su color, que se oscurece hacia «Ver marca». Sustituye
 * a la franja de marca del #349 en esas páginas. Sin el conteo de modelos (dirección).
 */

/** Mezcla dos colores `#rrggbb` en sRGB: `peso` del primero y el resto del segundo. */
export function mezclar(a: string, b: string, peso: number): string {
  const canal = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) =>
    Math.round(canal(a, i) * peso + canal(b, i) * (1 - peso))
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${c.join("")}`;
}

export type VistaBanner = {
  /** El color de la marca (sin color en el panel, el naranja de la barra de marcas). */
  acento: string;
  /** La forma de atrás, más oscura, que asoma por la diagonal (la del kit: 72 % con #3a1a00). */
  acentoOscuro: string;
  /** El fondo del banner en escritorio: el color de la marca al 58 % con blanco. */
  fondo: string;
  /** El texto del título sobre ese fondo, negro o blanco por contraste (AA). */
  tintaTitulo: string;
  /** El logo sobre el color de la marca, en una sola tinta: blanco si se lee (3:1), si no, negro. */
  tintaLogo: "clara" | "oscura";
  /**
   * La foto de la derecha: la «Foto de la cabecera» del kit de la marca; sin ella, su «Imagen de
   * la tarjeta»; sin ninguna, ninguna (el banner queda en su color, el respaldo del kit).
   */
  foto: ImagenLista | null;
};

export function vistaBanner(
  marca: Pick<MarcasMaquinaria, "colorMarca" | "kit" | "imagenTarjeta">,
): VistaBanner {
  return vistaBannerDe(
    marca.colorMarca,
    imagenDeMedia(marca.kit?.fotoCabecera, "") ?? imagenDeMedia(marca.imagenTarjeta, ""),
  );
}

/**
 * El mismo banner con el color y la foto ya elegidos: lo usa también la página de una categoría
 * técnica de repuestos para las páginas que cuelgan de ella (Filtros Donaldson en Filtración).
 */
export function vistaBannerDe(
  colorMarca: string | null | undefined,
  foto: ImagenLista | null,
): VistaBanner {
  const acento = colorDeMarca(colorMarca) ?? COLOR_SIN_MARCA;
  const fondo = mezclar(acento, "#ffffff", 0.58);
  return {
    acento,
    acentoOscuro: mezclar(acento, "#3a1a00", 0.72),
    fondo,
    tintaTitulo: tintaSobre(fondo),
    tintaLogo: tintaDeLogoSobre(acento) === "#ffffff" ? "clara" : "oscura",
    foto,
  };
}

/**
 * Un logo JPEG no tiene transparencia: teñido en una sola tinta sería un rectángulo (el de
 * Dynapac). Ese va con sus colores sobre una placa blanca, como la placa de la cabecera del kit.
 */
export function logoOpaco(url: string): boolean {
  return /\.jpe?g(?:$|[?#])/i.test(url);
}
