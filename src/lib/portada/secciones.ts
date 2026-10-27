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

// --- «Maquinaria pesada nueva»: una tarjeta por marca (diseño del cliente, 2026-10-27) -------

export type TarjetaMarca = {
  id: number;
  nombre: string;
  href: string;
  /** La presentación de la marca (su «Descripción» del panel). */
  texto: string | null;
  /** Decorativa: `alt` vacío. Sin foto, la tarjeta queda oscura lisa. */
  fondo: ImagenLista | null;
  /** `alt` = nombre de la marca: es lo único que la nombra en la tarjeta. El de todo el sitio. */
  logo: LogoConAlt | null;
};

/**
 * Una tarjeta por marca VISIBLE de nueva (la consulta ya quita las ocultas y la de aditamentos),
 * en el orden del panel: «Posición en la portada» y, sin ella, al final por nombre. La foto es la
 * de la cabecera del «Kit de marca» y, si no hay, la «Foto de la tarjeta en la portada»; el logo,
 * el de todo el sitio (el de repuestos si es la misma marca). Sin nombre o sin dirección no hay
 * tarjeta (no habría a dónde llevar).
 */
export function tarjetasDeMarcas(
  marcas: MarcasMaquinaria[],
  logos: IndiceLogos = new Map(),
): TarjetaMarca[] {
  const posicion = (m: MarcasMaquinaria) =>
    typeof m.ordenPortada === "number" ? m.ordenPortada : Number.POSITIVE_INFINITY;
  return [...marcas]
    .sort((a, b) => posicion(a) - posicion(b) || a.nombre.localeCompare(b.nombre, "es"))
    .flatMap((m) => {
      const nombre = m.nombre?.trim();
      if (!nombre || !m.slug) return [];
      const fondo =
        imagenDeMedia(m.kit?.fotoCabecera, "") ?? imagenDeMedia(m.imagenTarjeta, "") ?? null;
      return [
        {
          id: m.id,
          nombre,
          href: `${RUTA_MARCAS_NUEVA}${m.slug}/`,
          texto: m.descripcion?.trim() || null,
          fondo: fondo ? { ...fondo, alt: "" } : null,
          logo: conAlt(logoDeMarca(m, logos), nombre),
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
