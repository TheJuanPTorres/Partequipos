import type { EquiposNuevo, MarcasMaquinaria } from "@/payload-types";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";
import { logoDeMarca, type IndiceLogos, type LogoMarca } from "../marca/logoMarca";
import type { PlacaMarca } from "../repuestos/categoria";
import { rutas } from "../routes";
import { SLUG_ADITAMENTOS } from "../megamenu";
import { enlaceExternoDe } from "./enlaceExterno";

/**
 * Las baldosas del ÍNDICE DE MARCAS de maquinaria nueva (2026-10-19, «Mostrar
 * marcas» de Andrés, el mismo componente que el índice de marcas de repuestos).
 * Solo las marcas visibles CON equipos, por nombre. «Aditamentos» NO va
 * (dirección, 2026-10-20): no es una marca; su página sigue publicada y la
 * enlaza el megamenú. Se quita solo de aquí, no con «Mostrar en la web», que
 * ocultaría también la página.
 *
 * BALDOSAS DE COLOR (2026-11-04, dirección; el diseño del #417 de repuestos): cada marca del color
 * de su «Color de la marca» con el logo de todo el sitio en BLANCO (una sola tinta). Un logo que
 * ya es blanco (casilla «Pintar el logo en oscuro en el menú» marcada: es el logo blanco del
 * cliente) va tal cual. Si el blanco no llega a 3:1 sobre el color, o no hay color o logo, el
 * RESPALDO de siempre: el logo sobre gris (`vistaBaldosa`).
 *
 * Una marca SIN página propia («Enlace externo», LiuGong, 2026-11-03) sale aunque no tenga equipos
 * aquí: su baldosa lleva a su distribuidor, en pestaña nueva.
 */
/** Contraste mínimo del logo blanco sobre el color (WCAG 1.4.11, elementos gráficos). */
export const CONTRASTE_LOGO_BLANCO = 3;

/** El color de la baldosa si el logo blanco se lee sobre él (≥ 3:1); si no, `null` (respaldo gris). */
export function colorDeBaldosaNueva(color: string | null | undefined): string | null {
  const rgb = color ? rgbDeHex(color) : null;
  if (!rgb || !/^#[0-9a-f]{6}$/i.test(color!.trim())) return null;
  return contraste(1, luminancia(...rgb)) >= CONTRASTE_LOGO_BLANCO
    ? color!.trim().toLowerCase()
    : null;
}

/** El logo en blanco: el blanco tal cual si ya lo es; el de colores, en una sola tinta blanca. */
export function logoEnBlanco(logo: LogoMarca | null): LogoMarca | null {
  return logo ? { ...logo, oscuro: false, blanco: !logo.oscuro } : null;
}

export function placasDeMarcasNueva(
  marcas: MarcasMaquinaria[],
  equipos: ReadonlyArray<Pick<EquiposNuevo, "marca">>,
  logos: IndiceLogos,
): PlacaMarca[] {
  const conEquipos = new Set(
    equipos.map((e) => (typeof e.marca === "number" ? e.marca : e.marca?.id)),
  );
  const nombre = (m: MarcasMaquinaria) => m.nombre.trim();
  return marcas
    .filter(
      (m) =>
        m.nombre?.trim() &&
        m.slug?.trim() &&
        m.slug !== SLUG_ADITAMENTOS &&
        (conEquipos.has(m.id) || enlaceExternoDe(m)),
    )
    .sort((a, b) => nombre(a).localeCompare(nombre(b), "es"))
    .map((m) => {
      const externo = enlaceExternoDe(m);
      const logo = logoDeMarca(m, logos);
      return {
        id: m.id,
        nombre: nombre(m),
        href: externo ?? `${rutas.marcaMaquinaria(m.slug)}/`,
        ...(externo ? { externo: true as const } : {}),
        // El logo de todo el sitio (`LogoMarca`).
        logo,
        color: colorDeBaldosaNueva(m.colorMarca),
        logoSobreColor: logoEnBlanco(logo),
      };
    });
}
