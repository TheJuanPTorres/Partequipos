import type { EquiposNuevo, MarcasMaquinaria } from "@/payload-types";

import { contraste, luminancia, rgbDeHex } from "../portada/contraste";
import { oscurecer } from "../marca/franjaMarca";
import {
  buscarPorNombre,
  claveDeMarca,
  logoDeMarca,
  type IndiceLogos,
  type LogoMarca,
} from "../marca/logoMarca";
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

/** La baldosa de una marca de repuestos: su color y su logo para ese color. */
export type BaldosaDeRepuestos = { color: string; logo: LogoMarca };

/**
 * El color de la baldosa para un logo blanco: el propio si llega a 3:1; si no, OSCURECIDO lo
 * justo (mismo tono, mezclado con negro, como hizo #417 con Hitachi y Kobelco). `null` si no es
 * un `#rrggbb`.
 */
export function colorDeBaldosaNueva(color: string | null | undefined): string | null {
  const t = color?.trim().toLowerCase() ?? "";
  if (!/^#[0-9a-f]{6}$/.test(t)) return null;
  let k = 0;
  let c = t;
  while (contraste(1, luminancia(...rgbDeHex(c)!)) < CONTRASTE_LOGO_BLANCO && k < 1) {
    k = Math.round((k + 0.01) * 100) / 100;
    c = oscurecer(t, k);
  }
  return c;
}

/**
 * El logo en blanco: el blanco tal cual si ya lo es; el de colores, en una sola tinta blanca.
 * Un logo SIN transparencia (JPG: lleva su fondo blanco) no sirve: en tinta blanca saldría un
 * rectángulo blanco entero. Ese va sobre el gris de respaldo (`null`).
 */
export function logoEnBlanco(logo: LogoMarca | null): LogoMarca | null {
  if (!logo || /\.jpe?g$/i.test(logo.url.split(/[?#]/)[0] ?? "")) return null;
  return { ...logo, oscuro: false, blanco: !logo.oscuro };
}

export function placasDeMarcasNueva(
  marcas: MarcasMaquinaria[],
  equipos: ReadonlyArray<Pick<EquiposNuevo, "marca">>,
  logos: IndiceLogos,
  baldosas: ReadonlyMap<string, BaldosaDeRepuestos> = new Map(),
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
      // «Una marca, un solo logo»: la baldosa de la marca de repuestos con su nombre (Case, Hitachi,
      // Yanmar, LiuGong…); si no hay, su color de marca y su logo en blanco (Dynapac).
      const deRepuestos = buscarPorNombre(claveDeMarca(m.nombre), baldosas);
      const propia = logoEnBlanco(logo);
      const colorPropio = propia ? colorDeBaldosaNueva(m.colorMarca) : null;
      return {
        id: m.id,
        nombre: nombre(m),
        href: externo ?? `${rutas.marcaMaquinaria(m.slug)}/`,
        ...(externo ? { externo: true as const } : {}),
        // El logo de todo el sitio (`LogoMarca`).
        logo,
        color: deRepuestos ? deRepuestos.color : colorPropio,
        logoSobreColor: deRepuestos ? deRepuestos.logo : colorPropio ? propia : null,
      };
    });
}
