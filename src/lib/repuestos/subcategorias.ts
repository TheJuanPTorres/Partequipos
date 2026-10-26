import type { CategoriasTecnica } from "@/payload-types";

import { colorDeMarca, COLOR_SIN_MARCA, tintaSobre } from "../marca/colorMarca";
import { conAlt, logoPropio, type LogoConAlt } from "../marca/logoMarca";
import { rutas } from "../routes";

/**
 * PÁGINAS DENTRO DE UNA CATEGORÍA TÉCNICA (2026-10-26, dirección: «Filtros Donaldson» dentro
 * de «Filtración», en su URL de WordPress). Una categoría con «Cuelga de» es una subpágina:
 * su dirección es la de su categoría seguida de la suya, sale bajo ella (en el menú y en su
 * página) y NO en el índice de categorías, en las páginas de marca ni en el sitemap como
 * categoría de primer nivel. Lógica pura.
 */

/** La categoría de la que cuelga: su id o, poblada, al menos su id y su dirección. */
type Padre = number | { id: number; slug?: string | null } | null | undefined;

type ConPadre = Pick<CategoriasTecnica, "slug"> & { padre?: Padre };

/** Una categoría normal (sin «Cuelga de»). */
export function esCategoriaPrincipal(c: { padre?: Padre }): boolean {
  return c.padre === null || c.padre === undefined;
}

/** El id de la categoría de la que cuelga, o `null`. */
export function idDelPadre(c: { padre?: Padre }): number | null {
  const p = c.padre;
  if (p === null || p === undefined) return null;
  return typeof p === "object" ? p.id : p;
}

/**
 * La dirección de una categoría técnica: la suya o, si cuelga de otra, la de esa seguida de la
 * suya. Sin la categoría de la que cuelga poblada (o sin su dirección), `null`: mejor sin
 * enlace que con uno roto.
 */
export function rutaDeCategoriaTecnica(c: ConPadre): string | null {
  const slug = c.slug?.trim();
  if (!slug) return null;
  if (esCategoriaPrincipal(c)) return rutas.categoriaRepuestos(slug);
  const padre = c.padre;
  const slugPadre = typeof padre === "object" && padre ? padre.slug?.trim() : "";
  return slugPadre ? rutas.subcategoriaRepuestos(slugPadre, slug) : null;
}

/**
 * El ACCESO a una subpágina desde su categoría (el botón del menú bajo su baldosa y la franja
 * de la página de la categoría): su nombre, su dirección, su logo y el color de la marca con la
 * tinta que mejor se lee sobre él (AA garantizado, `tintaSobre`). Sin color, el de las marcas
 * sin color del sitio.
 */
export type AccesoSubcategoria = {
  id: number;
  nombre: string;
  href: string;
  logo: LogoConAlt | null;
  color: string;
  tinta: string;
};

type FuenteAcceso = ConPadre &
  Pick<CategoriasTecnica, "id" | "nombre" | "colorMarca"> & {
    logo?: number | { url?: string | null; width?: number | null; height?: number | null } | null;
  };

export function accesoDeSubcategoria(c: FuenteAcceso): AccesoSubcategoria | null {
  const href = rutaDeCategoriaTecnica(c);
  const nombre = c.nombre?.trim();
  if (!href || !nombre) return null;
  const color = colorDeMarca(c.colorMarca) ?? COLOR_SIN_MARCA;
  return {
    id: c.id,
    nombre,
    href,
    logo: conAlt(logoPropio({ nombre, logo: c.logo ?? null }), `Logo de ${nombre}`),
    color,
    tinta: tintaSobre(color),
  };
}

/** Los accesos de las subpáginas de una categoría, por nombre. */
export function accesosDe(
  padreId: number,
  todas: ReadonlyArray<FuenteAcceso>,
): AccesoSubcategoria[] {
  return todas
    .filter((c) => idDelPadre(c) === padreId)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .flatMap((c) => {
      const a = accesoDeSubcategoria(c);
      return a ? [a] : [];
    });
}
