import type { MarcasMaquinaria } from "@/payload-types";

import {
  buscarPorNombre,
  claveDeMarca,
  conAlt,
  logoDeMarca,
  logoPropio,
  type IndiceLogos,
  type LogoConAlt,
} from "../marca/logoMarca";
import {
  colorDeBaldosaNueva,
  CONTRASTE_LOGO_BLANCO,
  logoEnBlanco,
  type BaldosaDeRepuestos,
} from "../nueva/indiceMarcas";
import { enlaceExternoDe } from "../nueva/enlaceExterno";
import { contraste, luminancia, rgbDeHex } from "./contraste";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * SECCIONES 2 Y 3 DE LA PORTADA (fase D, docs/diseno/decisiones-home-ux9.md §11).
 * Lógica pura: convierte lo que devuelve Payload en lo que se pinta. El acceso a
 * datos está en `src/lib/queries/getMaquinaria.ts`.
 */

export const RUTA_MARCAS_NUEVA = "/maquinaria-pesada/maquinaria-pesada-nueva/marcas/";
export const RUTA_USADA = "/maquinaria-pesada/maquinaria-pesada-usada/";

/** La categoría que lleva pestaña propia y el botón «Ver todas las excavadoras». */
export const SLUG_EXCAVADORAS = "excavadoras";

// --- «Maquinaria pesada nueva»: una tarjeta por marca (diseño del cliente v2, 2026-11-08) -------

/** El panel de color de la tarjeta: su degradado y si es claro (luz y textos oscuros encima). */
export type PanelTarjeta = { inicio: string; fin: string; claro: boolean };

export type TarjetaMarca = {
  id: number;
  nombre: string;
  /** Su página o, si la marca no tiene página aquí (LiuGong), su «Enlace externo». */
  href: string;
  /** Solo con «Enlace externo»: el dominio del botón («maquitecno.co»), en otra pestaña. */
  externo: { dominio: string } | null;
  panel: PanelTarjeta;
  /** El logo que va sobre el panel, con el nombre como `alt`. Sin logo, se escribe el nombre. */
  logo: LogoConAlt | null;
  /** La máquina recortada (decorativa). Sin ella, la foto de la marca (`foto`) en su sitio. */
  maquina: ImagenLista | null;
  foto: ImagenLista | null;
  distribuidor: { nombre: string; logo: LogoConAlt | null } | null;
};

/** Panel sin color de marca: blanco que baja a gris azulado, como el de LiuGong del diseño. */
const PANEL_BLANCO: PanelTarjeta = { inicio: "#ffffff", fin: "#e7ebf2", claro: true };

/** Mezcla un `#rrggbb` con blanco (`k` > 0) o con negro (`k` < 0). */
function mezclar(hex: string, k: number): string {
  const rgb = rgbDeHex(hex) ?? [0, 0, 0];
  const destino = k > 0 ? 255 : 0;
  const a = Math.abs(k);
  return `#${rgb
    .map((c) =>
      Math.round(c + (destino - c) * a)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * El degradado del panel desde el color de la marca. Claro si el blanco no llega a 3:1 sobre él
 * (Case): entonces baja hacia un tono algo más oscuro, como en el diseño; oscuro, sube a uno más
 * claro y el logo (blanco) va en la esquina del color propio.
 */
export function panelDeColor(color: string): PanelTarjeta {
  const [r, g, b] = rgbDeHex(color) ?? [255, 255, 255];
  const claro = contraste(1, luminancia(r, g, b)) < CONTRASTE_LOGO_BLANCO;
  return { inicio: color, fin: mezclar(color, claro ? -0.07 : 0.2), claro };
}

/** El dominio del enlace externo, sin «www.» («https://maquitecno.co/» → «maquitecno.co»). */
export function dominioDe(url: string): string {
  return new URL(url).hostname.replace(/^www\./i, "");
}

/**
 * Una tarjeta por marca VISIBLE de nueva (la consulta ya quita las ocultas y la de aditamentos),
 * en el orden del panel: «Posición en la portada» y, sin ella, al final por nombre. Una marca sin
 * página propia (LiuGong) también va: su tarjeta lleva a su «Enlace externo».
 *
 * Color y logo con la regla «una marca, un solo logo» (dirección, 2026-11-04), la misma de las
 * baldosas del índice de marcas: la baldosa de la marca de repuestos con su nombre (su color y su
 * logo tal cual); si no hay, su «Color de la marca» con su logo en blanco (Dynapac); si tampoco,
 * panel blanco con el logo de todo el sitio.
 *
 * La máquina es la de su «Tarjeta en la portada»; sin ella, la foto de la marca de antes (la de la
 * cabecera del kit o la de la tarjeta). El logo del distribuidor se pinta en blanco sobre un panel
 * oscuro. Sin nombre o sin dirección no hay tarjeta (no habría a dónde llevar).
 */
export function tarjetasDeMarcas(
  marcas: MarcasMaquinaria[],
  logos: IndiceLogos = new Map(),
  baldosas: ReadonlyMap<string, BaldosaDeRepuestos> = new Map(),
): TarjetaMarca[] {
  const posicion = (m: MarcasMaquinaria) =>
    typeof m.ordenPortada === "number" ? m.ordenPortada : Number.POSITIVE_INFINITY;
  return [...marcas]
    .sort((a, b) => posicion(a) - posicion(b) || a.nombre.localeCompare(b.nombre, "es"))
    .flatMap((m) => {
      const nombre = m.nombre?.trim();
      if (!nombre || !m.slug) return [];
      const externo = enlaceExternoDe(m);

      const logoSitio = logoDeMarca(m, logos);
      const deRepuestos = buscarPorNombre(claveDeMarca(m.nombre), baldosas);
      const enBlanco = logoEnBlanco(logoSitio);
      const colorPropio = enBlanco ? colorDeBaldosaNueva(m.colorMarca) : null;
      const [panel, logo] = deRepuestos
        ? [panelDeColor(deRepuestos.color), deRepuestos.logo]
        : colorPropio && enBlanco
          ? [panelDeColor(colorPropio), enBlanco]
          : [PANEL_BLANCO, logoSitio];

      const decorativa = (media: Parameters<typeof imagenDeMedia>[0]) => {
        const i = imagenDeMedia(media, "");
        return i ? { ...i, alt: "" } : null;
      };
      const tp = m.portada;
      const nombreDistribuidor = tp?.distribuidorNombre?.trim();
      const logoDistribuidor = logoPropio({ logo: tp?.distribuidorLogo });
      return [
        {
          id: m.id,
          nombre,
          href: externo ?? `${RUTA_MARCAS_NUEVA}${m.slug}/`,
          externo: externo ? { dominio: dominioDe(externo) } : null,
          panel,
          logo: conAlt(logo, nombre),
          maquina: decorativa(tp?.maquina),
          foto: decorativa(m.kit?.fotoCabecera) ?? decorativa(m.imagenTarjeta),
          distribuidor: nombreDistribuidor
            ? {
                nombre: nombreDistribuidor,
                logo: conAlt(
                  logoDistribuidor && !panel.claro
                    ? logoEnBlanco(logoDistribuidor)
                    : logoDistribuidor,
                  nombreDistribuidor,
                ),
              }
            : null,
        },
      ];
    });
}

// --- Sección de usados: la tarjeta de una unidad (kit del cliente, `kitCliente.ts`) ----

export type DatoFicha = { clave: "peso" | "anio" | "horometro"; etiqueta: string; valor: string };

export type TarjetaEquipo = {
  id: number;
  /** El nombre entero («Excavadora Hitachi ZX350H-5B 2016»), en una línea como la Home V2. */
  nombre: string;
  imagen: ImagenLista | null;
  ficha: DatoFicha[];
  /**
   * La PÁGINA de la unidad: «Ver más» lleva a ella y, sin JavaScript,
   * «Cotizar ahora» baja a su formulario. Una unidad aún sin dirección web no pinta
   * «Ver más», y su «Cotizar ahora» va a /contactanos/.
   */
  href: string | null;
};

export function hrefDeCategoriaUsada(slug: string): string {
  return `${RUTA_USADA}${slug}/`;
}

/** Los nombres de las tres categorías del filtro de la portada, desde el panel (página «inicio»). */
export type EtiquetasEnlaces = {
  excavadoras?: string | null;
  otros?: string | null;
  aditamentos?: string | null;
};
