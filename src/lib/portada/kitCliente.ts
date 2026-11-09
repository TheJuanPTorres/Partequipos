import type { CategoriasTecnica, CategoriasUsada, EquiposUsado, Pagina } from "@/payload-types";

import { SLUG_CATEGORIA_USADA_ADITAMENTOS } from "../aditamentos/wordpress";
import {
  conAlt,
  logoDeMarca,
  type IndiceLogos,
  type LogoConAlt,
  type LogoMarca,
} from "../marca/logoMarca";
import { validarEnlace } from "../fields/reglasPortada";
import { normalizarEnlaceExterno } from "../nueva/enlaceExterno";
import { rutas, SEGMENTO_OTROS_USADA } from "../routes";
import { imagenDeMedia, poblado, type ImagenLista } from "../utils/relations";
import { filasDeLaBanda, type FilaBanda } from "./marcasBanda";
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

/**
 * El título de «Venta de repuestos» partido en tres trozos para pintar en rojo la «Palabra del
 * título en rojo» (diseño v3, 2026-11-03): antes, la palabra tal como está escrita en el título y
 * después. Se busca sin distinguir mayúsculas, la primera vez. Sin palabra, o si el título no la
 * lleva, todo va en `antes`.
 */
export function partirTitulo(
  titulo: string,
  resaltado: string,
): { antes: string; resaltado: string; despues: string } {
  const palabra = resaltado.trim();
  const i = palabra ? titulo.toLocaleLowerCase("es").indexOf(palabra.toLocaleLowerCase("es")) : -1;
  if (i < 0) return { antes: titulo, resaltado: "", despues: "" };
  return {
    antes: titulo.slice(0, i),
    resaltado: titulo.slice(i, i + palabra.length),
    despues: titulo.slice(i + palabra.length),
  };
}

// --- Marcas -----------------------------------------------------------------------------------

export type LogoDePortada = {
  id: string;
  nombre: string;
  logo: LogoConAlt;
  /** A dónde lleva el logo (la página de la marca de repuestos); sin él, no es un enlace. */
  href?: string;
  /** `href` es de otro sitio: se abre en otra pestaña, con icono y aviso (logos libres). */
  externo?: boolean;
};

/** Una marca de repuestos tal como la lee la consulta ligera de la portada. */
export type MarcaDeRepuestos = { id: number; nombre: string; slug: string; logo: LogoMarca };

/**
 * Los logos de la sección «Marcas de repuestos»: los de las marcas de repuestos del panel, en el
 * orden que traen, cada uno con su alt y el enlace a su página de marca. La marca sin logo no sale.
 */
export function logosDeMarcasRepuestos(marcas: MarcaDeRepuestos[]): LogoDePortada[] {
  return marcas.flatMap((m) => {
    const nombre = m.nombre.trim();
    if (!nombre || !m.slug) return [];
    return [
      {
        id: String(m.id),
        nombre,
        logo: { ...m.logo, alt: nombre },
        href: `${rutas.marca(m.slug)}/`,
      },
    ];
  });
}

/**
 * Los logos de la banda «Marcas de repuestos» (#429 y logos libres, 2026-11-08): las filas de
 * «Marcas de la banda» en su orden —una marca, con su logo y su página; un logo libre, con su
 * imagen tal cual, su nombre como alt y su enlace si lo tiene— o, con la lista vacía, TODAS las marcas por orden alfabético, como siempre. Una marca elegida sin logo o borrada
 * no deja hueco (si ninguna se pinta, la banda queda vacía y la sección no sale, como en el #429).
 * El enlace de un logo libre: una ruta o dirección del sitio (misma pestaña) o una dirección https
 * de otro sitio (`externo`: otra pestaña); uno que no valga, ninguno.
 */
export function logosDeLaBandaDeRepuestos(
  todas: MarcaDeRepuestos[],
  filas: readonly FilaBanda[] | null | undefined,
): LogoDePortada[] {
  const elegidas = filasDeLaBanda(filas);
  if (elegidas.length === 0) return logosDeMarcasRepuestos(todas);
  const porId = new Map(todas.map((m) => [m.id, m]));
  return elegidas.flatMap((f): LogoDePortada[] => {
    if (f.tipo === "marca") {
      const m = porId.get(f.marca);
      return m ? logosDeMarcasRepuestos([m]) : [];
    }
    const externo = f.enlace ? normalizarEnlaceExterno(f.enlace) : null;
    const interno = f.enlace && !externo && validarEnlace(f.enlace) === true ? f.enlace : null;
    const href = externo ?? interno ?? undefined;
    return [
      {
        id: `libre-${f.clave}`,
        nombre: f.nombre,
        logo: { ...f.imagen, oscuro: false, alt: f.nombre },
        ...(href ? { href } : {}),
        ...(externo ? { externo: true } : {}),
      },
    ];
  });
}

/**
 * Los logos de la banda, en su orden, con la REGLA COMÚN de «un solo logo por marca»
 * (`logoMarca.ts`): si el nombre es el de una marca de repuestos, su logo, el de todo el sitio; si
 * no, el elegido en la lista. Uno sin logo ni nombre no sale. (Del 2026-10-26 por la mañana mandaba
 * el de la lista, para los logos del kit del cliente; Juan Pablo se queda con los de antes.)
 */
export function logosDeLaBanda(
  seccion: Pagina["seccionLogos"],
  indice: IndiceLogos = new Map(),
): LogoDePortada[] {
  return (seccion?.logos ?? []).flatMap((l, i) => {
    const nombre = l.nombre?.trim();
    if (!nombre) return [];
    const logo = conAlt(logoDeMarca({ nombre, logo: l.logo }, indice), nombre);
    return logo ? [{ id: l.id ?? String(i), nombre, logo }] : [];
  });
}
