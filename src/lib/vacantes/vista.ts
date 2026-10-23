import type { PaginasIndice } from "@/payload-types";

import type { VistaEncabezado } from "../repuestos/marca";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";
import type { Vacante } from "./tipos";

/**
 * «TRABAJA CON NOSOTROS» (plantilla de Andrés, 2026-10-23): lógica pura de la
 * página. Los textos salen del grupo «Trabaja con nosotros» de «Páginas índice
 * y contacto»; un campo vacío usa el texto del diseño.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

/** Los textos del diseño de Andrés (export `Trabaja con Nosotros.json`), para los campos vacíos. */
export const TEXTOS_TRABAJA = {
  antetitulo: "Partequipos",
  titulo: "Trabaja con nosotros",
  tituloEquipo: "Únete a nuestro equipo",
  textoEquipo:
    "Buscamos profesionales que quieran crecer, asumir nuevos retos y aportar sus conocimientos en una compañía con experiencia, solidez y visión de futuro. Si desea formar parte de nuestro equipo, lo invitamos a enviarnos su hoja de vida y conocer las oportunidades disponibles.",
  tituloHojaDeVida: "¿No ves una oferta para tu perfil?",
  textoHojaDeVida:
    "Siempre estamos buscando nuevos talentos. Si actualmente no encuentras una vacante que se ajuste a tu experiencia, envíanos tu hoja de vida.\n\nEnvíanos tu CV y construyamos juntos nuevas oportunidades.",
  botonHojaDeVida: "Envíanos tu hoja de vida",
} as const;

/** Con menos vacantes que esto, el filtro por ciudad no se pinta (Juan Pablo). */
export const MIN_VACANTES_PARA_FILTRO = 8;

export type VistaTrabaja = {
  encabezado: VistaEncabezado;
  equipo: { titulo: string; texto: string };
  hojaDeVida: { titulo: string; parrafos: string[]; boton: string; imagen: ImagenLista | null };
};

const parrafos = (valor: string) =>
  valor
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export function vistaTrabaja(grupo: PaginasIndice["trabaja"] | null | undefined): VistaTrabaja {
  return {
    encabezado: {
      antetitulo: texto(grupo?.antetitulo) || TEXTOS_TRABAJA.antetitulo,
      // Una página sin `<h1>` sería peor que una con el texto del diseño (§3.4).
      linea1: texto(grupo?.titulo) || TEXTOS_TRABAJA.titulo,
      linea2: "",
      descripcion: "",
      fondo: imagenDeMedia(grupo?.fondo, ""),
      logo: null,
    },
    equipo: {
      titulo: texto(grupo?.tituloEquipo) || TEXTOS_TRABAJA.tituloEquipo,
      texto: texto(grupo?.textoEquipo) || TEXTOS_TRABAJA.textoEquipo,
    },
    hojaDeVida: {
      titulo: texto(grupo?.tituloHojaDeVida) || TEXTOS_TRABAJA.tituloHojaDeVida,
      parrafos: parrafos(texto(grupo?.textoHojaDeVida) || TEXTOS_TRABAJA.textoHojaDeVida),
      boton: texto(grupo?.botonHojaDeVida) || TEXTOS_TRABAJA.botonHojaDeVida,
      imagen: imagenDeMedia(grupo?.imagenHojaDeVida, ""),
    },
  };
}

/** «Montería» → «monteria»: el valor de la ciudad en la URL del filtro. */
export function slugCiudad(ciudad: string): string {
  return ciudad
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type OpcionCiudad = { slug: string; nombre: string; cuantas: number };

/** Las ciudades con vacantes, por orden alfabético, con cuántas tiene cada una. */
export function ciudadesDe(vacantes: Vacante[]): OpcionCiudad[] {
  const mapa = new Map<string, OpcionCiudad>();
  for (const v of vacantes) {
    const slug = slugCiudad(v.ciudad);
    if (!slug) continue;
    const actual = mapa.get(slug);
    if (actual) actual.cuantas += 1;
    else mapa.set(slug, { slug, nombre: v.ciudad, cuantas: 1 });
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export type Filtro =
  /** Sin filtro (o sin bastantes vacantes para tenerlo). */
  | { tipo: "todas" }
  | { tipo: "ciudad"; ciudad: OpcionCiudad }
  /** Un valor que no es ninguna ciudad: la página redirige a la URL sin filtro. */
  | { tipo: "invalido" };

/**
 * El filtro pedido en la URL (`?ciudad=bogota`). Con menos de 8 vacantes no hay
 * filtro y cualquier `ciudad` es inválida (una sola URL por contenido). Otros
 * parámetros (`utm_source`…) no cuentan: la canónica ya es la URL sin nada.
 */
export function filtroPedido(vacantes: Vacante[], ciudad: string | string[] | undefined): Filtro {
  if (ciudad === undefined) return { tipo: "todas" };
  if (Array.isArray(ciudad) || vacantes.length < MIN_VACANTES_PARA_FILTRO) {
    return { tipo: "invalido" };
  }
  const opcion = ciudadesDe(vacantes).find((c) => c.slug === ciudad);
  return opcion ? { tipo: "ciudad", ciudad: opcion } : { tipo: "invalido" };
}

export function aplicarFiltro(vacantes: Vacante[], filtro: Filtro): Vacante[] {
  return filtro.tipo === "ciudad"
    ? vacantes.filter((v) => slugCiudad(v.ciudad) === filtro.ciudad.slug)
    : vacantes;
}
