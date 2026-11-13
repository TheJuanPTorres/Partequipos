import type { CategoriasTecnica, Pagina } from "@/payload-types";

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
import { imagenDeMedia, type ImagenLista } from "../utils/relations";
import { colocarLogo, type Recorte } from "../marca/tamanoOptico";
import { filasDeLaBanda, type FilaBanda } from "./marcasBanda";
import { hrefDeCategoriaUsada, SLUG_EXCAVADORAS, type EtiquetasEnlaces } from "./secciones";

/**
 * EL KIT DE LA PORTADA DEL CLIENTE (2026-10-26): tres secciones con diseño propio del cliente,
 * PORTADAS (no copiadas) de sus prototipos y alimentadas desde el panel. Lógica pura: lo que
 * devuelve Payload, en lo que se pinta.
 *
 * - «Maquinaria pesada usada»: cabecera con la máquina y las tarjetas de tres tipos (enlaces a
 *   su categoría). Sin carrusel de unidades desde el 2026-11-09 (dirección).
 * - «Venta de repuestos»: las categorías técnicas con posición en la portada, con su foto.
 * - Marcas: la banda de logos en bucle, con la máquina delante.
 */

/** Una imagen del kit, decorativa: `alt` vacío. Sin imagen, `null` (la sección se pinta sin ella). */
export function imagenDecorativa(media: Parameters<typeof imagenDeMedia>[0]): ImagenLista | null {
  const imagen = imagenDeMedia(media, "");
  return imagen ? { ...imagen, alt: "" } : null;
}

// --- Maquinaria pesada usada ------------------------------------------------------------------

export type ClaveFiltro = typeof SLUG_EXCAVADORAS | typeof SEGMENTO_OTROS_USADA | "aditamentos";

export type FiltroUsados = {
  clave: ClaveFiltro;
  /** El nombre de la tarjeta del tipo (del panel; vacío, el de siempre). */
  nombre: string;
  /** La página de esa categoría. */
  href: string;
  imagen: ImagenLista | null;
};

/**
 * Las TRES tarjetas de tipo, en el orden del diseño (Excavadora, Otros y Aditamentos). Siempre
 * las tres, aunque una no tenga unidades: su página existe.
 */
export function filtrosDeUsados(seccion: Pagina["seccionUsada"]): FiltroUsados[] {
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
    },
    {
      clave: SEGMENTO_OTROS_USADA,
      nombre: nombre(etiquetas.otros, "Otros"),
      href: hrefDeCategoriaUsada(SEGMENTO_OTROS_USADA),
      imagen: imagenDecorativa(seccion?.imagenOtros),
    },
    {
      clave: SLUG_CATEGORIA_USADA_ADITAMENTOS,
      nombre: nombre(etiquetas.aditamentos, "Aditamentos"),
      href: hrefDeCategoriaUsada(SLUG_CATEGORIA_USADA_ADITAMENTOS),
      imagen: imagenDecorativa(seccion?.imagenAditamentos),
    },
  ];
}

// --- Venta de repuestos -----------------------------------------------------------------------

/**
 * LAS PIEZAS DE «VENTA DE REPUESTOS» AL MISMO TAMAÑO (dirección, 2026-11-09). Cada foto trae su
 * propio margen blanco (unas piezas llenan el fichero y otras ocupan un tercio), y con
 * `object-fit: contain` unas se veían grandes y otras encogidas. El servidor mide la caja de la
 * pieza (`recorteVisible`, `sharp().trim()`, en caché) y aquí se escala el fichero para que TODAS
 * las piezas tengan la misma ÁREA visible, centradas en la caja 4:3 de la tarjeta: lo mismo que
 * los logos del selector de marcas (#439, `colocarLogo`).
 *
 * Nunca se deforma (misma escala en los dos ejes) ni se corta la pieza: su caja cabe siempre en
 * `MARCO_PIEZA` (el 94 % de la caja); lo que sale fuera es margen blanco del fichero, recortado por
 * la tarjeta. Una pieza muy alargada toca el marco y queda con algo menos de área.
 *
 * MÁS GRANDES (clienta, 2026-11-12): el área común sube un 31 % (la pieza 4:3 pasa del 70 al 80 %
 * del ancho de la caja) y el marco, del 86 al 94 %. La igualación no cambia: misma área para todas.
 */
export const CAJA_FOTO = { ancho: 400, alto: 300 };
const MARCO_PIEZA = 0.94;
/** El área de una pieza 4:3 que ocupa el 80 % del ancho de la caja: 320 × 240. */
const AREA_PIEZA = 320 * 240;

/** Dónde va el fichero entero, en % de la caja de la foto (puede salirse por los lados). */
export type ColocacionFoto = { izquierda: number; arriba: number; ancho: number; alto: number };

const pct = (n: number) => Math.round(n * 1000) / 1000;

export function colocarFotoRepuesto(
  imagen: { width: number; height: number },
  recorte: Recorte,
): ColocacionFoto | null {
  if (!(imagen.width > 0 && imagen.height > 0)) return null;
  const marco = { ancho: CAJA_FOTO.ancho * MARCO_PIEZA, alto: CAJA_FOTO.alto * MARCO_PIEZA };
  const c = colocarLogo({ ...imagen, recorte }, { ...marco, area: AREA_PIEZA });
  const desdeX = (CAJA_FOTO.ancho - marco.ancho) / 2 + c.visible.izquierda + c.imagen.izquierda;
  const desdeY = (CAJA_FOTO.alto - marco.alto) / 2 + c.visible.arriba + c.imagen.arriba;
  return {
    izquierda: pct((desdeX / CAJA_FOTO.ancho) * 100),
    arriba: pct((desdeY / CAJA_FOTO.alto) * 100),
    ancho: pct((c.imagen.ancho / CAJA_FOTO.ancho) * 100),
    alto: pct((c.imagen.alto / CAJA_FOTO.alto) * 100),
  };
}

export type CategoriaDePortada = {
  id: number;
  nombre: string;
  /** La «Foto en la portada» o, vacía, la «Imagen de la tarjeta». Decorativa. */
  imagen: ImagenLista | null;
  /** La pieza al tamaño común (`colocarFotoRepuesto`); sin medir, `null` y la foto en `contain`. */
  colocacion?: ColocacionFoto | null;
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
