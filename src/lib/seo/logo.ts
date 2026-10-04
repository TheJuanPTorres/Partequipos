import { seoConfig } from "./config";

/**
 * Logo institucional (CLAUDE.md §10.8), editable en el panel: campo «Logo» del
 * global `seo`, sección «Imágenes».
 *
 * Mientras el campo esté vacío NADA cambia: cada sitio usa lo de siempre.
 *  - Cabecera y pie: `public/logo-partequipos.png` (el de Andrés, transparente).
 *  - JSON-LD `Organization`/`Article` e imagen social por defecto: la URL del
 *    Blob de `seoConfig.logoPath` / `seoConfig.defaultOgImagePath`.
 * Con el logo subido, los cuatro usan el de `Media`.
 *
 * Funciones puras: el acceso a la base está en `src/lib/queries/getSeo.ts`.
 */

/** Lo que llega del global con `depth: 1`: la imagen poblada, su id o nada. */
export type LogoGlobal =
  | number
  | {
      url?: string | null;
      width?: number | null;
      height?: number | null;
    }
  | null
  | undefined;

/** Imagen lista para `next/image`. */
export type ImagenLogo = { src: string; width: number; height: number };

/** Ancho al que se pinta el logo en la cabecera y el pie (el de siempre). */
const ANCHO_PINTADO = 187;

/** El logo de siempre de la cabecera y el pie (ux-9, Andrés). */
export const LOGO_SITIO_RESPALDO: ImagenLogo = {
  src: "/logo-partequipos.png",
  width: ANCHO_PINTADO,
  height: 51,
};

/** El logo subido, si está poblado y tiene medidas; si no, `null`. */
function subido(logo: LogoGlobal): { url: string; width: number; height: number } | null {
  if (!logo || typeof logo !== "object") return null;
  const url = logo.url?.trim();
  const { width, height } = logo;
  if (!url || !width || !height || width <= 0 || height <= 0) return null;
  return { url, width, height };
}

/**
 * Para la cabecera y el pie. Las medidas van escaladas al ancho pintado: así
 * `next/image` genera el `srcset` para ~187 px y no para el ancho del original
 * (la deuda del logo de 1920 px de CLAUDE.md §2).
 */
export function logoDelSitio(logo: LogoGlobal): ImagenLogo {
  const s = subido(logo);
  if (!s) return LOGO_SITIO_RESPALDO;
  return {
    src: s.url,
    width: ANCHO_PINTADO,
    height: Math.max(1, Math.round((ANCHO_PINTADO * s.height) / s.width)),
  };
}

/** Para `Organization.logo` y `Article.publisher.logo` del JSON-LD. */
export function urlLogoBuscadores(logo: LogoGlobal): string {
  return subido(logo)?.url ?? seoConfig.logoPath;
}

/** Imagen social de las páginas que no tienen una propia. */
export function urlImagenSocialPorDefecto(logo: LogoGlobal): string {
  return subido(logo)?.url ?? seoConfig.defaultOgImagePath;
}
