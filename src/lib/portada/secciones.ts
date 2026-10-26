import type { MarcasMaquinaria } from "@/payload-types";

import { conAlt, logoDeMarca, type IndiceLogos, type LogoConAlt } from "../marca/logoMarca";
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

// --- Sección 2: tarjetas de marca -------------------------------------------

export type TarjetaMarca = {
  id: number;
  nombre: string;
  href: string;
  texto: string | null;
  /** Decorativa: `alt` vacío. El nombre lo da el logo. */
  fondo: ImagenLista;
  /** `alt` = nombre de la marca: es lo único que la nombra en la tarjeta. El de todo el sitio. */
  logo: LogoConAlt | null;
};

/**
 * Solo las marcas con POSICIÓN EN LA PORTADA y FOTO DE TARJETA (sin foto, el
 * texto blanco caería sobre la página), en el orden de esa posición. En ux-9:
 * Hitachi, CASE y Yanmar.
 */
export function tarjetasDeMarcas(
  marcas: MarcasMaquinaria[],
  logos: IndiceLogos = new Map(),
): TarjetaMarca[] {
  const conPosicion = marcas
    .filter((m) => typeof m.ordenPortada === "number")
    .sort((a, b) => (a.ordenPortada ?? 0) - (b.ordenPortada ?? 0));
  return conPosicion.flatMap((m) => {
    const fondo = imagenDeMedia(m.imagenTarjeta, "");
    const nombre = m.nombre?.trim();
    if (!fondo || !nombre || !m.slug) return [];
    // El logo de la marca, el de todo el sitio: el de repuestos si es la misma marca.
    const logo = conAlt(logoDeMarca(m, logos), nombre);
    return [
      {
        id: m.id,
        nombre,
        href: `${RUTA_MARCAS_NUEVA}${m.slug}/`,
        texto: m.descripcion?.trim() || null,
        fondo: { ...fondo, alt: "" },
        logo,
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
