import type { CategoriasTecnica, CategoriasUsada, EquiposUsado, Pagina } from "@/payload-types";

import { SLUG_CATEGORIA_USADA_ADITAMENTOS } from "../aditamentos/wordpress";
import {
  conAlt,
  logoDeMarca,
  logoPropio,
  type IndiceLogos,
  type LogoConAlt,
} from "../marca/logoMarca";
import { rutas, SEGMENTO_OTROS_USADA } from "../routes";
import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";
import {
  hrefDeCategoriaUsada,
  SLUG_EXCAVADORAS,
  type DatoFicha,
  type EtiquetasEnlaces,
  type TarjetaEquipo,
} from "./secciones";

/**
 * EL KIT DE LA PORTADA DEL CLIENTE (2026-10-26): tres secciones con diseño propio del cliente,
 * PORTADAS (no copiadas) de sus prototipos y alimentadas desde el panel. Lógica pura: lo que
 * devuelve Payload, en lo que se pinta.
 *
 * - «Maquinaria pesada usada»: cabecera con la máquina, un FILTRO de tres categorías y el
 *   carrusel de las unidades de la elegida.
 * - «Venta de repuestos»: las categorías técnicas con posición en la portada, con su foto.
 * - Marcas: la banda de logos en bucle, con la máquina delante.
 */

/** Una imagen del kit, decorativa: `alt` vacío. Sin imagen, `null` (la sección se pinta sin ella). */
export function imagenDecorativa(media: Parameters<typeof imagenDeMedia>[0]): ImagenLista | null {
  const imagen = imagenDeMedia(media, "");
  return imagen ? { ...imagen, alt: "" } : null;
}

// --- Maquinaria pesada usada ------------------------------------------------------------------

/** Unidades por categoría del filtro: tres posiciones del carrusel de tres. */
export const USADOS_POR_FILTRO = 9;

export type ClaveFiltro = typeof SLUG_EXCAVADORAS | typeof SEGMENTO_OTROS_USADA | "aditamentos";

export type FiltroUsados = {
  clave: ClaveFiltro;
  /** El nombre de la tarjeta del filtro (del panel; vacío, el de siempre). */
  nombre: string;
  /** «Ver todo» de esa categoría: su página. */
  href: string;
  imagen: ImagenLista | null;
  tarjetas: TarjetaEquipo[];
};

/**
 * La ficha de la tarjeta con las TRES filas siempre (peso operativo, año y horómetro), un guion
 * donde falte el dato: así las filas de las tarjetas vecinas no se descuadran (diseño del cliente).
 */
export function fichaCompleta(
  e: Pick<EquiposUsado, "pesoOperativo" | "anio" | "horometro">,
): DatoFicha[] {
  const valido = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;
  const numero = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
  const horas = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0, useGrouping: "always" });
  return [
    {
      clave: "peso",
      etiqueta: "Peso operativo",
      valor: valido(e.pesoOperativo) ? `${numero.format(e.pesoOperativo)} t` : "—",
    },
    {
      clave: "anio",
      etiqueta: "Año",
      valor: valido(e.anio) && Number.isInteger(e.anio) ? String(e.anio) : "—",
    },
    {
      clave: "horometro",
      etiqueta: "Horómetro",
      valor: valido(e.horometro) ? `${horas.format(e.horometro)} h` : "—",
    },
  ];
}

/** Las tarjetas de unas unidades, en su orden: solo las disponibles, con nombre y categoría. */
export function tarjetasDeUnidades(
  equipos: EquiposUsado[],
  por: number = USADOS_POR_FILTRO,
): TarjetaEquipo[] {
  const tarjetas: TarjetaEquipo[] = [];
  for (const e of equipos) {
    const categoria = poblado<CategoriasUsada>(e.categoria);
    const nombre = e.nombre?.trim();
    if (!e.disponible || !nombre || !categoria?.slug) continue;
    tarjetas.push({
      id: e.id,
      nombre,
      imagen: imagenDeMedia(Array.isArray(e.imagenes) ? e.imagenes[0] : null, nombre),
      ficha: fichaCompleta(e),
      href: e.slug ? `${hrefDeCategoriaUsada(categoria.slug)}${e.slug}/` : null,
    });
  }
  return tarjetas.slice(0, por);
}

/**
 * Las TRES categorías del filtro, en el orden del diseño (Excavadora, Otros y Aditamentos), con
 * sus unidades. Siempre las tres, aunque una no tenga unidades: su página existe y el carrusel
 * enseña un aviso.
 */
export function filtrosDeUsados(
  unidades: { excavadoras: EquiposUsado[]; otros: EquiposUsado[]; aditamentos: EquiposUsado[] },
  seccion: Pagina["seccionUsada"],
): FiltroUsados[] {
  const nombre = (v: string | null | undefined, defecto: string) => v?.trim() || defecto;
  const etiquetas: EtiquetasEnlaces = {
    excavadoras: seccion?.pestanaExcavadoras,
    otros: seccion?.pestanaOtros,
    aditamentos: seccion?.pestanaAditamentos,
  };
  return [
    {
      clave: SLUG_EXCAVADORAS,
      nombre: nombre(etiquetas.excavadoras, "Excavadora"),
      href: hrefDeCategoriaUsada(SLUG_EXCAVADORAS),
      imagen: imagenDecorativa(seccion?.imagenExcavadoras),
      tarjetas: tarjetasDeUnidades(unidades.excavadoras),
    },
    {
      clave: SEGMENTO_OTROS_USADA,
      nombre: nombre(etiquetas.otros, "Otros"),
      href: hrefDeCategoriaUsada(SEGMENTO_OTROS_USADA),
      imagen: imagenDecorativa(seccion?.imagenOtros),
      tarjetas: tarjetasDeUnidades(unidades.otros),
    },
    {
      clave: SLUG_CATEGORIA_USADA_ADITAMENTOS,
      nombre: nombre(etiquetas.aditamentos, "Aditamentos"),
      href: hrefDeCategoriaUsada(SLUG_CATEGORIA_USADA_ADITAMENTOS),
      imagen: imagenDecorativa(seccion?.imagenAditamentos),
      tarjetas: tarjetasDeUnidades(unidades.aditamentos),
    },
  ];
}

// --- Venta de repuestos -----------------------------------------------------------------------

export type CategoriaDePortada = {
  id: number;
  nombre: string;
  /** La «Foto en la portada» o, vacía, la «Imagen de la tarjeta». Decorativa. */
  imagen: ImagenLista | null;
  /** «Ver todos»: el enlace de la tarjeta del panel o la página de la categoría. */
  href: string;
};

/**
 * Las categorías técnicas con POSICIÓN EN LA PORTADA, por ella (empate: por nombre), con su
 * título de portada o su nombre.
 */
export function categoriasDePortada(categorias: CategoriasTecnica[]): CategoriaDePortada[] {
  return categorias
    .filter((c) => typeof c.ordenPortada === "number" && c.nombre?.trim() && c.slug)
    .sort(
      (a, b) =>
        (a.ordenPortada ?? 0) - (b.ordenPortada ?? 0) || a.nombre.localeCompare(b.nombre, "es"),
    )
    .map((c) => ({
      id: c.id,
      nombre: c.tituloPortada?.trim() || c.nombre.trim(),
      imagen: imagenDecorativa(c.imagenPortada) ?? imagenDecorativa(c.imagen),
      href: c.enlace?.trim() || rutas.categoriaRepuestos(c.slug),
    }));
}

// --- Marcas -----------------------------------------------------------------------------------

export type LogoDePortada = { id: string; nombre: string; logo: LogoConAlt };

/**
 * Los logos de la banda, en su orden. Aquí MANDA el logo elegido en la lista (dirección,
 * 2026-10-26: los SVG del kit del cliente, pasados a PNG); si no se puede pintar, el de la marca
 * del sitio con ese nombre (`logoMarca.ts`). Uno sin logo ni nombre no sale.
 */
export function logosDeLaBanda(
  seccion: Pagina["seccionLogos"],
  indice: IndiceLogos = new Map(),
): LogoDePortada[] {
  return (seccion?.logos ?? []).flatMap((l, i) => {
    const nombre = l.nombre?.trim();
    if (!nombre) return [];
    const logo = conAlt(logoPropio({ logo: l.logo }) ?? logoDeMarca({ nombre }, indice), nombre);
    return logo ? [{ id: l.id ?? String(i), nombre, logo }] : [];
  });
}
