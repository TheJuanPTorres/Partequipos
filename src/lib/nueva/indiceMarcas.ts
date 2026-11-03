import type { EquiposNuevo, MarcasMaquinaria } from "@/payload-types";

import { logoDeMarca, type IndiceLogos } from "../marca/logoMarca";
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
 * Una marca SIN página propia («Enlace externo», LiuGong, 2026-11-03) sale aunque no tenga equipos
 * aquí: su baldosa lleva a su distribuidor, en pestaña nueva.
 */
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
      return {
        id: m.id,
        nombre: nombre(m),
        href: externo ?? `${rutas.marcaMaquinaria(m.slug)}/`,
        ...(externo ? { externo: true as const } : {}),
        // El logo de todo el sitio (`LogoMarca`).
        logo: logoDeMarca(m, logos),
      };
    });
}
