/**
 * DIRECCIÓN WEB de cada unidad de maquinaria USADA (decisión de dirección,
 * 2026-10-16): `/maquinaria-pesada/maquinaria-pesada-usada/<categoria>/<slug>/`.
 *
 * El slug sale del NOMBRE compuesto de la unidad («Excavadora Hitachi
 * ZX350H-5B 2016» → `excavadora-hitachi-zx350h-5b-2016`), que ya no lleva el
 * número de serie. Las direcciones de WordPress SÍ lo llevaban (el slug de 86
 * de las 128 unidades lo incluye), por eso no se conservan: se redirigen con
 * un 301 a la nueva.
 *
 * Módulo puro (sin Payload ni red): lo usan el campo del panel, el importador
 * y las pruebas.
 */
import { formatSlug } from "../utils/formatSlug";

/**
 * Slugs que una unidad no puede tener: `pagina` chocaría con la paginación de
 * su categoría (`/<categoria>/pagina/<n>/`) y `marcas` con las páginas de marca
 * (`/marcas/<marca>/`). En Next el segmento fijo gana al dinámico, así que una
 * unidad con esa dirección quedaría tapada sin ningún error.
 */
export const SLUGS_RESERVADOS_UNIDAD_USADA: ReadonlySet<string> = new Set(["pagina", "marcas"]);

export const MENSAJE_SLUG_UNIDAD_RESERVADO =
  "Esa dirección web está reservada (la usan la paginación y las marcas de usados). Elige otra.";

export function esSlugUnidadReservado(slug: string): boolean {
  return SLUGS_RESERVADOS_UNIDAD_USADA.has(slug.trim().toLowerCase());
}

/** Slug base de una unidad a partir de su nombre. Vacío si el nombre no tiene letras ni cifras. */
export function slugDeUnidad(nombre: string): string {
  const base = formatSlug(nombre);
  return esSlugUnidadReservado(base) ? `${base}-unidad` : base;
}

/**
 * El primer slug libre dentro de una categoría: el base si nadie lo usa; si
 * no, el base con el sufijo (el id de WordPress en el importador) y, si aun así
 * choca, con un contador.
 */
export function slugLibre(
  base: string,
  ocupados: ReadonlySet<string>,
  sufijo?: string | number,
): string {
  if (!ocupados.has(base)) return base;
  if (sufijo !== undefined) {
    const conSufijo = `${base}-${sufijo}`;
    if (!ocupados.has(conSufijo)) return conSufijo;
  }
  for (let n = 2; ; n++) {
    const candidato = `${base}-${n}`;
    if (!ocupados.has(candidato)) return candidato;
  }
}

/**
 * Ruta (sin dominio y sin barra final) de una URL antigua de WordPress:
 * `https://partequipos.com/maquinaria-pesada-usada/<slug>/` →
 * `/maquinaria-pesada-usada/<slug>`. `null` si no es una URL de esta raíz.
 */
export function rutaAntiguaDeUnidad(enlace: string): string | null {
  let url: URL;
  try {
    url = new URL(enlace);
  } catch {
    return null;
  }
  const ruta = url.pathname.replace(/\/+$/, "");
  return /^\/maquinaria-pesada-usada\/[^/]+$/.test(ruta) ? ruta : null;
}
