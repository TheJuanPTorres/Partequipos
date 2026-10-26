import { conAlt, logoPropio, type LogoConAlt, type LogoMarca } from "@/lib/marca/logoMarca";
import type { CategoriasTecnica, Marca, RepuestosMarca, TiposEquipo } from "@/payload-types";

import { colorDeMarca } from "../marca/colorMarca";
import { rutas } from "../routes";
import { tipoEnTitulo } from "../seo/porDefecto";
import { imagenDeMedia, type ImagenLista } from "../utils/relations";
import { segmentoDeTipo } from "./anidado";
import { agruparPorSerie, claveSerie, seriesDeTipo } from "./series";
import type { ModeloEnlace } from "./tipo";

/**
 * Lógica pura de la página de marca de repuestos (ux-9,
 * docs/diseno/decisiones-repuestos-marca.md): convierte lo que devuelve
 * Payload en lo que se pinta. El acceso a datos está en
 * `lib/queries/getRepuestosMarca.ts`.
 */

const texto = (v: string | null | undefined) => v?.trim() ?? "";

// --- Encabezado --------------------------------------------------------------

export type VistaEncabezado = {
  /** Línea en negrita sobre el título (solo las páginas índice la llevan). */
  antetitulo?: string;
  /** Primera línea del `<h1>`: «Repuestos para maquinaria pesada». */
  linea1: string;
  /** Segunda: «CATERPILLAR En Colombia». Vacía: no se pinta. */
  linea2: string;
  /** Texto de presentación: la descripción de la marca. */
  descripcion: string;
  fondo: ImagenLista | null;
  /** El logo de la marca (`LogoMarca`) va sobre el título, en un cuadrado blanco. */
  logo: LogoConAlt | null;
};

/** El logo de una marca de repuestos con «Logo de <marca>» como texto alternativo. */
export function logoConAlt(marca: Marca, nombre = marca.nombre.trim()): LogoConAlt | null {
  return conAlt(logoPropio(marca), `Logo de ${nombre}`);
}

/**
 * El título nunca queda vacío: sin el texto del global, el `<h1>` usa el
 * de respaldo. Una página sin `<h1>` sería peor que una con él (§3.4).
 */
export function vistaEncabezado(marca: Marca, global: RepuestosMarca): VistaEncabezado {
  const nombre = marca.nombre.trim();
  const linea1 = texto(global.tituloHero) || "Repuestos para maquinaria pesada";
  const sufijo = texto(global.subtituloHero);
  return {
    linea1,
    linea2: [nombre.toUpperCase(), sufijo].filter(Boolean).join(" "),
    descripcion: texto(marca.descripcion),
    fondo: imagenDeMedia(marca.fondoHero, ""),
    logo: logoConAlt(marca, nombre),
  };
}

// --- Categorías --------------------------------------------------------------

export type CategoriaMarca = {
  id: number;
  nombre: string;
  icono: CategoriasTecnica["icono"];
  /** Su página de categoría. Sin slug no hay página y se pinta SIN enlace (nada de enlaces rotos). */
  href: string | null;
};

/**
 * Orden: primero las que tienen `ordenMarca` (de menor a mayor), luego el
 * resto por nombre. Una categoría sin nombre no sale.
 */
export function categoriasDeMarca(categorias: CategoriasTecnica[]): CategoriaMarca[] {
  return categorias
    .filter((c) => c.nombre?.trim())
    .sort((a, b) => {
      const oa = typeof a.ordenMarca === "number" ? a.ordenMarca : Infinity;
      const ob = typeof b.ordenMarca === "number" ? b.ordenMarca : Infinity;
      if (oa !== ob) return oa < ob ? -1 : 1;
      return a.nombre.localeCompare(b.nombre, "es");
    })
    .map((c) => ({
      id: c.id,
      nombre: c.nombre.trim(),
      icono: c.icono ?? null,
      href: texto(c.slug) ? rutas.categoriaRepuestos(texto(c.slug)) : null,
    }));
}

// --- Tarjetas ------------------------------------------------------------------

/** El panel «Ver todo» de una tarjeta (`VerTodosEquipos`): sus modelos, cada uno a su ficha. */
export type PanelTarjeta = {
  titulo: string;
  total: number;
  /** Cada modelo con su foto: la suya o, sin ella, la de su serie o la del tipo (rejilla del panel). */
  elementos: {
    id: number | string;
    nombre: string;
    href: string | null;
    imagen: ImagenLista | null;
  }[];
  /** Texto del enlace discreto a la página completa (el `href` de la tarjeta). */
  enlacePagina: string;
  /** El color de la marca, para la barra del panel. */
  acento: string | null;
};

export type TarjetaMarca = {
  clave: string;
  titulo: string;
  /** `null`: una tarjeta sin página (un modelo que WordPress nombra sin ficha): sin botón. */
  href: string | null;
  /** Decorativa: el título ya nombra la tarjeta. */
  imagen: ImagenLista | null;
  /** Las del marketplace se ocultan en móvil, como en ux-9. */
  soloEscritorio: boolean;
  /** Línea bajo el título (p. ej. «3 unidades disponibles» en el índice de usados). */
  detalle?: string;
  /** El logo de la marca (`LogoMarca`), entero y sin recortar, en lugar de la foto (índice de usados). */
  logo?: LogoMarca;
  /** Con él, «Ver todo» abre el panel con la lista; sin JavaScript sigue llevando a `href`. */
  panel?: PanelTarjeta;
};

/**
 * Una tarjeta por tipo de la marca, con su enlace «Ver todo» a la página del
 * tipo. El título es el de ux-9: «Repuestos para maquinaria pesada <tipo>
 * <MARCA>». Un tipo sin nombre o sin slug no sale.
 *
 * Un tipo con SERIES (Hitachi: EX y ZAXIS) pinta una tarjeta por serie, en su
 * orden, con el título de WordPress («… excavadora HITACHI EX»), su foto (o la
 * del tipo) y el enlace al ancla de la serie en la página del tipo.
 *
 * Con `modelosDe` (la lista completa de cada tipo, `listaDeModelos`), «Ver todo» abre el
 * PANEL con los modelos de la tarjeta (dirección, 2026-10-21): los de la serie, o todos los
 * del tipo. Sin modelos, el enlace de siempre.
 */
export function tarjetasDeTipos(
  marca: Marca,
  tipos: TiposEquipo[],
  modelosDe?: (tipo: TiposEquipo) => ModeloEnlace[],
): TarjetaMarca[] {
  const nombre = marca.nombre.trim();
  const nombreMarca = nombre.toUpperCase();
  const acento = colorDeMarca(marca.colorMarca);
  const panel = (
    titulo: string,
    modelos: ModeloEnlace[],
    pagina: string,
    respaldo: ImagenLista | null,
  ) =>
    modelos.length === 0
      ? {}
      : {
          panel: {
            titulo,
            total: modelos.length,
            elementos: modelos.map(({ id, nombre: n, href, imagen }) => ({
              id,
              nombre: n,
              href,
              imagen: imagen ?? respaldo,
            })),
            enlacePagina: `Ver la página de ${pagina}`,
            acento,
          },
        };
  return tipos
    .filter((t) => t.nombre?.trim() && t.slug?.trim())
    .flatMap((t) => {
      const titulo = `Repuestos para maquinaria pesada ${t.nombre.trim()} ${nombreMarca}`;
      const href = rutas.tipo(marca.slug, segmentoDeTipo(t));
      const imagenTipo = imagenDeMedia(t.imagen, "");
      const series = seriesDeTipo(t);
      const modelos = modelosDe?.(t) ?? [];
      const tituloPanel = `${tipoEnTitulo(t.nombre)} ${nombreMarca}`;
      const pagina = `${t.nombre.trim()} ${nombre}`;
      if (series.length === 0) {
        return [
          {
            clave: `tipo-${t.id}`,
            titulo,
            href,
            imagen: imagenTipo,
            soloEscritorio: false,
            ...panel(tituloPanel, modelos, pagina, imagenTipo),
          },
        ];
      }
      const grupos = agruparPorSerie(series, modelos, (m) => m.serie) ?? [];
      return series.map((s) => {
        const fila = t.series?.find((f) => claveSerie(f.nombre) === claveSerie(s.nombre));
        const deSerie = grupos.find((g) => g.ancla === s.ancla)?.modelos ?? [];
        const imagenSerie = imagenDeMedia(fila?.imagen, "") ?? imagenTipo;
        return {
          clave: `tipo-${t.id}-${s.ancla}`,
          titulo: `${titulo} ${s.nombre.toUpperCase()}`,
          // Con la barra final: así el ancla no pasa por la redirección de `trailingSlash`.
          href: `${href}/#${s.ancla}`,
          imagen: imagenSerie,
          soloEscritorio: false,
          ...panel(`${tituloPanel} ${s.nombre.toUpperCase()}`, deSerie, pagina, imagenSerie),
        };
      });
    });
}
