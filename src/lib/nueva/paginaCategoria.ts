import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import type { VistaEncabezado } from "../repuestos/marca";
import { tituloPorDefecto } from "../seo/porDefecto";
import { imagenDeMedia, poblado } from "../utils/relations";

import type { TarjetaEquipo } from "./paginaMarcaAndres";
import { tarjetasDeEquipos } from "./paginaTipo";

/**
 * Lógica pura de la CATEGORÍA QUE MEZCLA MARCAS de maquinaria nueva sin marketplace
 * (2026-10-22, dirección): sus equipos, como TARJETAS de equipo, agrupados por marca y tipo.
 */

export type GrupoDeCategoria = {
  clave: string;
  /** El subtítulo del grupo: «Excavadoras Hitachi» (el `<h1>` de la página de ese tipo). */
  titulo: string;
  /** La marca del grupo, para su logo en la franja (`FranjaMarca`) cuando la página mezcla marcas. */
  marca: MarcasMaquinaria;
  tarjetas: TarjetaEquipo[];
};

/**
 * Un grupo por marca y tipo, por nombre de marca y luego de tipo; dentro, los equipos en el orden
 * en que llegan (por nombre). La ficha cuelga del tipo del equipo. Un equipo sin marca o sin
 * tipo poblados no sale (no habría ficha a la que ir), y un grupo vacío tampoco.
 */
export function gruposPorMarcaYTipo(equipos: EquiposNuevo[]): GrupoDeCategoria[] {
  const grupos = new Map<
    string,
    { marca: MarcasMaquinaria; tipo: TiposMaquinaria; equipos: EquiposNuevo[] }
  >();
  for (const e of equipos) {
    const marca = poblado<MarcasMaquinaria>(e.marca);
    const tipo = poblado<TiposMaquinaria>(e.tipo);
    if (!marca || !tipo) continue;
    const clave = `${marca.slug}-${tipo.slug}`;
    const g = grupos.get(clave) ?? { marca, tipo, equipos: [] };
    g.equipos.push(e);
    grupos.set(clave, g);
  }
  return [...grupos.entries()]
    .sort(
      ([, a], [, b]) =>
        a.marca.nombre.localeCompare(b.marca.nombre, "es") ||
        a.tipo.nombre.localeCompare(b.tipo.nombre, "es"),
    )
    .map(([clave, g]) => ({
      clave,
      titulo: tituloPorDefecto.tipoMaquinaria(g.tipo.nombre, g.marca.nombre),
      marca: g.marca,
      tarjetas: tarjetasDeEquipos(g.marca, g.tipo.slug, g.equipos),
    }))
    .filter((g) => g.tarjetas.length > 0);
}

/** Cada palabra con su inicial en mayúscula; el resto, tal cual (regla del sitio, 2026-10-22). */
const mayusculaEnCadaPalabra = (texto: string) =>
  texto
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toLocaleUpperCase("es") + p.slice(1))
    .join(" ");

/**
 * El `<h1>` del banner de una página general de tipo (dirección, 2026-10-23): «Maquinaria Tipo
 * Bulldozers Nueva», con el nombre del tipo con mayúscula en cada palabra. El título SEO sigue
 * siendo el de siempre («Bulldozers nuevos», `tituloPorDefecto.categoriaNueva`).
 */
export function tituloBannerTipoNueva(nombre: string): string {
  return `Maquinaria Tipo ${mayusculaEnCadaPalabra(nombre)} Nueva`;
}

/** Más de una marca entre los grupos: entonces cada grupo empieza con la franja de su marca. */
export function mezclaMarcas(grupos: readonly GrupoDeCategoria[]): boolean {
  return new Set(grupos.map((g) => g.marca.slug)).size > 1;
}

/** Cabecera: el `<h1>` del banner, la descripción y la foto del primer equipo. */
export function vistaEncabezadoCategoriaNueva(
  titulo: string,
  descripcion: string | null | undefined,
  equipos: EquiposNuevo[],
): VistaEncabezado {
  let fondo = null;
  for (const e of equipos) {
    fondo = (e.imagenes ?? []).map((i) => imagenDeMedia(i, "")).find(Boolean) ?? null;
    if (fondo) break;
  }
  return { linea1: titulo, linea2: "", descripcion: descripcion?.trim() ?? "", fondo, logo: null };
}
