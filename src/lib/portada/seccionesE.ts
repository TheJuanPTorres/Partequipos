import type { CategoriasTecnica, Pagina } from "@/payload-types";

import { imagenDeMedia, type ImagenLista } from "../utils/relations";

/**
 * SECCIONES 4 Y 5 DE LA PORTADA (fase E, docs/diseno/decisiones-home-ux9.md §18).
 * Lógica pura: convierte lo que devuelve Payload en lo que se pinta. El acceso
 * a datos está en `src/lib/queries/getCategoriasTecnicas.ts` y en la portada.
 */

// --- Sección 4: logos -----------------------------------------------------------

export type LogoMarca = { id: string; nombre: string; logo: ImagenLista };

/** Los logos de la portada, en su orden. Uno sin imagen o sin nombre no sale. */
export function logosDeMarcas(seccion: Pagina["seccionLogos"]): LogoMarca[] {
  return (seccion?.logos ?? []).flatMap((l, i) => {
    const nombre = l.nombre?.trim();
    const logo = nombre ? imagenDeMedia(l.logo, nombre) : null;
    if (!nombre || !logo) return [];
    return [{ id: l.id ?? String(i), nombre, logo: { ...logo, alt: nombre } }];
  });
}

// --- Sección 5: tarjetas de repuestos ------------------------------------------------

export type IconoCategoria = NonNullable<CategoriasTecnica["icono"]>;

export type TarjetaRepuesto = {
  id: number;
  titulo: string;
  texto: string | null;
  /** Decorativa: `alt` vacío. El título ya nombra la tarjeta. */
  imagen: ImagenLista | null;
  icono: IconoCategoria | null;
  href: string | null;
};

/**
 * Solo las categorías con POSICIÓN EN LA PORTADA, ordenadas por ella (empate:
 * por nombre). La imagen es opcional: sin ella la tarjeta se pinta solo con el
 * texto, sin hueco, que es como se ve en producción mientras las fotos de ux-9
 * (L3) sigan sin licencia.
 */
/*
 * TÍTULO EN PORTADA (2026-10-02): la tarjeta usa el título propio de la
 * portada si la categoría lo tiene y, si no, el nombre real. Así ux-9 puede
 * decir «Blades y corte» sin renombrar la categoría del catálogo (campo
 * `tituloPortada`, migración 20261002_214044_titulo_portada_repuestos).
 */
export function tarjetasDeRepuestos(categorias: CategoriasTecnica[]): TarjetaRepuesto[] {
  return categorias
    .filter((c) => typeof c.ordenPortada === "number" && c.nombre?.trim())
    .sort(
      (a, b) =>
        (a.ordenPortada ?? 0) - (b.ordenPortada ?? 0) || a.nombre.localeCompare(b.nombre, "es"),
    )
    .map((c) => {
      const imagen = imagenDeMedia(c.imagen, "");
      return {
        id: c.id,
        titulo: c.tituloPortada?.trim() || c.nombre.trim(),
        texto: c.descripcion?.trim() || null,
        imagen: imagen ? { ...imagen, alt: "" } : null,
        icono: c.icono ?? null,
        href: c.enlace?.trim() || null,
      };
    });
}
