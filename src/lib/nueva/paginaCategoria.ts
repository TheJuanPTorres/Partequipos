import type { EquiposNuevo, MarcasMaquinaria, TiposMaquinaria } from "@/payload-types";

import { colorDeMarca, tintaDeLogoSobre } from "../marca/colorMarca";
import type { LogoConAlt } from "../marca/logoMarca";
import type { VistaEncabezado } from "../repuestos/marca";
import { tituloPorDefecto } from "../seo/porDefecto";
import { imagenDeMedia, poblado } from "../utils/relations";

import type { TarjetaEquipo } from "./paginaMarcaAndres";
import { SLUG_ADITAMENTOS } from "./indiceTipos";
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

/**
 * El naranja de la barra de series de repuestos (el color de Hitachi): el de la pastilla activa
 * de una marca sin color (dirección, 2026-10-23).
 */
export const COLOR_BARRA_SIN_MARCA = "#fc661c";

/** Una pastilla de la barra de marcas: lleva al primer grupo de la marca. */
export type PastillaMarca = {
  ancla: string;
  /** El nombre de la marca: el texto sin logo y el nombre accesible con él. */
  titulo: string;
  logo: LogoConAlt | null;
  /** El fondo de la pastilla activa (el color de la marca o el naranja) y la tinta del logo encima
   * (`tintaDeLogoSobre`: blanco con 3:1 o más, negro solo en los claros). */
  color: { fondo: string; tinta: string };
};

/**
 * LA BARRA DE MARCAS de la página general de tipo (dirección, 2026-10-23): una pastilla por
 * marca, en el orden de los grupos, que lleva a la franja de su primer grupo (`grupo-<clave>`).
 * Solo con 2 o más marcas; con una, ninguna.
 */
export function barraDeMarcas(
  grupos: GrupoDeCategoria[],
  logoDe: (marca: MarcasMaquinaria) => LogoConAlt | null,
): PastillaMarca[] {
  const vistas = new Set<string>();
  const pastillas: PastillaMarca[] = [];
  for (const g of grupos) {
    if (vistas.has(g.marca.slug)) continue;
    vistas.add(g.marca.slug);
    const fondo = colorDeMarca(g.marca.colorMarca) ?? COLOR_BARRA_SIN_MARCA;
    pastillas.push({
      ancla: `grupo-${g.clave}`,
      titulo: g.marca.nombre.trim(),
      logo: logoDe(g.marca),
      color: { fondo, tinta: tintaDeLogoSobre(fondo) },
    });
  }
  return pastillas.length >= 2 ? pastillas : [];
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

/**
 * Las páginas generales de tipo muestran SOLO MARCAS (dirección, 2026-10-23): fuera los equipos
 * de la marca «Aditamentos» (p. ej. «Aditamentos para excavadoras» en Excavadoras), que tienen
 * su propia página. Sin ellos tampoco cuentan para la foto del banner ni para indexar.
 */
export function sinAditamentos(equipos: EquiposNuevo[]): EquiposNuevo[] {
  return equipos.filter((e) => poblado<MarcasMaquinaria>(e.marca)?.slug !== SLUG_ADITAMENTOS);
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
