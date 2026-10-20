import type { EquiposNuevo, MarcasMaquinaria } from "@/payload-types";

import { logoDeMarca, type IndiceLogos } from "../marca/logoMarca";
import type { PlacaMarca } from "../repuestos/categoria";
import { rutas } from "../routes";
import { SLUG_ADITAMENTOS } from "../megamenu";

/**
 * Las baldosas del ÍNDICE DE MARCAS de maquinaria nueva (2026-10-19, «Mostrar
 * marcas» de Andrés, el mismo componente que el índice de marcas de repuestos).
 * Solo las marcas visibles CON equipos; «Aditamentos» (no es una marca, pero es la
 * entrada a los aditamentos) va al final, con su nombre en lugar de logo (sin logo ni color).
 */
export function placasDeMarcasNueva(
  marcas: MarcasMaquinaria[],
  equipos: ReadonlyArray<Pick<EquiposNuevo, "marca">>,
  logos: IndiceLogos,
): PlacaMarca[] {
  const conEquipos = new Set(
    equipos.map((e) => (typeof e.marca === "number" ? e.marca : e.marca?.id)),
  );
  const validas = marcas.filter((m) => m.nombre?.trim() && m.slug?.trim() && conEquipos.has(m.id));
  const nombre = (m: MarcasMaquinaria) => m.nombre.trim();
  const porNombre = (a: MarcasMaquinaria, b: MarcasMaquinaria) =>
    nombre(a).localeCompare(nombre(b), "es");
  const ordenadas = [
    ...validas.filter((m) => m.slug !== SLUG_ADITAMENTOS).sort(porNombre),
    ...validas.filter((m) => m.slug === SLUG_ADITAMENTOS),
  ];
  return ordenadas.map((m) => {
    const aditamentos = m.slug === SLUG_ADITAMENTOS;
    return {
      id: m.id,
      nombre: nombre(m),
      href: `${rutas.marcaMaquinaria(m.slug)}/`,
      // El logo de todo el sitio (`LogoMarca`); Aditamentos, con su nombre.
      logo: aditamentos ? null : logoDeMarca(m, logos),
    };
  });
}
