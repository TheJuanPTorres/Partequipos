import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import type { TarjetaMarca } from "../repuestos/marca";
import { rutas } from "../routes";
import { imagenDeMedia } from "../utils/relations";

/**
 * Lógica pura de la PÁGINA DE MARCA «ADITAMENTOS» con la plantilla de Andrés
 * (elementor 4020, 2026-10-20): cabecera con el título revelado, un bloque por
 * tipo con sus productos como tarjetas, contacto, la franja de servicios,
 * «Nuestro compromiso…» y las sedes. Las demás marcas siguen con la «Plantilla 1».
 */

/** Textos de la plantilla (los de Andrés, sin la errata «Aditamientos» del export). */
export const TEXTOS_ADITAMENTOS = {
  antetitulo: "Partequipos",
  titulo: "Aditamentos para maquinaria pesada",
  franja: ["Maquinaria pesada", "Servicio técnico", "Repuestos de calidad"],
  compromisoTitulo:
    "Nuestro compromiso es ofrecerle soluciones para cada una de sus necesidades y proyectos a nivel nacional.",
  compromisoEntradilla: "Somos especialistas en repuestos de maquinaria pesada.",
  compromisoTexto:
    "Trabajamos con una amplia variedad de marcas de maquinaria pesada y repuestos, incluyendo: Link Belt, Caterpillar, Hitachi, Hyundai, Doosan, Komatsu, Kobelco, Case, John Deere, New Holland, Volvo, Liugong, Sumitomo, Yanmar, Sany, Jcb y muchas más.",
  compromisoBoton: "Solicita asesoría",
} as const;

/** TEMPORAL (muestra): se sustituye por el campo «Diseño de la página» de la marca. */
export function usaDisenoAditamentos(marca: Pick<MarcasMaquinaria, "slug">): boolean {
  return marca.slug === "aditamentos";
}

export type SeccionAditamentos = {
  clave: string;
  /** «Aditamentos para excavadoras»: el nombre del tipo (con «Aditamentos para» si no lo lleva). */
  titulo: string;
  tarjetas: TarjetaMarca[];
};

const idDe = (v: number | { id: number } | null | undefined) => (typeof v === "number" ? v : v?.id);

/**
 * Un bloque por tipo CON productos, en el orden de los tipos; cada producto una
 * sola vez (el export repite «Línea húmeda»), con su primera foto y «Ver todo»
 * a SU ficha. `equipos` llega ordenado por nombre.
 */
export function seccionesAditamentos(
  marca: Pick<MarcasMaquinaria, "slug">,
  tipos: TiposMaquinaria[],
  equipos: EquiposNuevo[],
): SeccionAditamentos[] {
  const vistos = new Set<number>();
  return tipos.flatMap((tipo) => {
    const tarjetas: TarjetaMarca[] = [];
    for (const equipo of equipos) {
      if (idDe(equipo.tipo) !== tipo.id || vistos.has(equipo.id)) continue;
      vistos.add(equipo.id);
      const foto = (equipo.imagenes ?? []).map((i) => imagenDeMedia(i, "")).find(Boolean) ?? null;
      tarjetas.push({
        clave: `equipo-${equipo.id}`,
        titulo: equipo.nombre,
        href: `${rutas.equipoNuevo(marca.slug, tipo.slug, equipo.slug)}/`,
        imagen: foto,
        soloEscritorio: false,
      });
    }
    if (tarjetas.length === 0) return [];
    // En la base los tipos ya se llaman «Aditamentos para excavadoras»: no se repite.
    const nombre = tipo.nombre.trim();
    const titulo = /^aditamentos\b/i.test(nombre) ? nombre : `Aditamentos para ${nombre}`;
    return [{ clave: `tipo-${tipo.id}`, titulo, tarjetas }];
  });
}
