import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  conConsulta,
  consultaRecibida,
  depurar,
  hayFiltros,
  leerSeleccion,
  metadataFiltrada,
  otrosParametros,
  resolverListado,
  type ParametrosURL,
} from "../filtros";
import {
  getCategoriaNuevaConEquipos,
  getListadoNueva,
  type EquipoNuevoListado,
} from "../queries/getMaquinaria";
import { rutas } from "../routes";
import { absoluteUrl, indexacionPermitida } from "../seo/config";
import { metadataDe } from "../seo/metadata";
import { METADATA_404 } from "../seo/noEncontrada";
import { descripcionPorDefecto, tituloPorDefecto } from "../seo/porDefecto";
import { CATALOGO_NUEVA } from "./filtros";

/**
 * Los listados de maquinaria NUEVA con la plantilla «Categoría secundaria» de
 * ux-9 (decisiones de dirección del 2026-10-14):
 * - el ÍNDICE de nueva (`/maquinaria-pesada/maquinaria-pesada-nueva/`), con
 *   todos los equipos;
 * - cada CATEGORÍA (`…/nueva/excavadoras/`), con la categoría fija en la URL.
 * Cada uno con su paginación (`…/pagina/<n>/`) y los filtros del módulo
 * común (`src/lib/filtros/`, del agente C) con el adaptador de nueva.
 *
 * DINÁMICOS (leen la query), como los de usados, con los datos en la caché de
 * datos (`datos:nueva`). Las páginas filtradas no se indexan.
 */
export type TipoListadoNueva = "indice" | "categoria";

/** Equipos por página: la vista en lista pinta 3 tarjetas por «pantalla» de ux-9; 12 cierra la rejilla de 3 y de 2. */
export const POR_PAGINA_NUEVA = 12;

/** Título y descripción del índice de nueva (los de siempre). */
export const TITULO_NUEVA = "Maquinaria pesada nueva";
export const DESCRIPCION_NUEVA =
  "Equipos nuevos organizados por marca y tipo, con ficha técnica y solicitud de cotización.";

export type AmbitoNueva = {
  tipo: TipoListadoNueva;
  /** El slug de la categoría, o null en el índice. */
  slug: string | null;
  /** El nombre de la categoría (o «Maquinaria pesada nueva» en el índice). */
  nombre: string;
  /** El `<h1>` y el título por defecto. */
  titulo: string;
  descripcion: string | null;
  seo: { metaTitle?: string | null; metaDescription?: string | null } | null;
  equipos: EquipoNuevoListado[];
  /** Ruta de la página n, sin barra final (la 1 es la del índice o la categoría). */
  ruta: (pagina: number) => string;
  /** Las pestañas: una por categoría, más «Aditamentos» (decisión 2). */
  pestanas: { href: string; texto: string; activa: boolean }[];
};

/** La marca de nueva que hace de «Aditamentos» (sus 4 URL no se tocan). */
const SLUG_ADITAMENTOS = "aditamentos";

async function ambitoDe(tipo: TipoListadoNueva, slug: string | null): Promise<AmbitoNueva | null> {
  const { equipos, categorias } = await getListadoNueva();
  const pestanas = [
    ...categorias.map((c) => ({
      href: `${rutas.categoriaNueva(c.slug)}/`,
      texto: c.nombre,
      activa: tipo === "categoria" && c.slug === slug,
    })),
    {
      href: `${rutas.marcaMaquinaria(SLUG_ADITAMENTOS)}/`,
      texto: "Aditamentos",
      activa: false,
    },
  ];
  if (tipo === "indice") {
    return {
      tipo,
      slug: null,
      nombre: TITULO_NUEVA,
      titulo: TITULO_NUEVA,
      descripcion: DESCRIPCION_NUEVA,
      seo: null,
      equipos,
      ruta: (n) => rutas.nuevaPagina(n),
      pestanas,
    };
  }
  const datos = slug ? await getCategoriaNuevaConEquipos(slug) : null;
  if (!datos) return null;
  const { categoria } = datos;
  return {
    tipo,
    slug: categoria.slug,
    nombre: categoria.nombre,
    titulo: tituloPorDefecto.categoriaNueva(categoria.nombre),
    descripcion: categoria.descripcion ?? null,
    seo: categoria.seo ?? null,
    equipos: datos.equipos,
    ruta: (n) => rutas.categoriaNuevaPagina(categoria.slug, n),
    pestanas,
  };
}

/**
 * Lo que pinta la página: el ámbito y el listado resuelto. Redirige (308) si
 * la query no está en su forma canónica, y da 404 si la categoría no existe o
 * esa página no existe con esa selección.
 */
export async function cargarListadoNueva(
  tipo: TipoListadoNueva,
  slug: string | null,
  pagina: number,
  parametros: ParametrosURL,
) {
  const ambito = await ambitoDe(tipo, slug);
  if (!ambito) notFound();
  const listado = resolverListado({
    items: ambito.equipos,
    parametros,
    catalogo: CATALOGO_NUEVA,
    pagina,
    porPagina: POR_PAGINA_NUEVA,
    ruta: `${ambito.ruta(pagina)}/`,
  });
  if (listado.tipo === "redirigir") permanentRedirect(listado.destino);
  if (listado.tipo === "no-existe") notFound();
  return { ambito, listado };
}

/**
 * La metadata de una página del listado, como en usados:
 * - página 1 sin filtros: la del registro (su SEO o el título por defecto);
 * - página n: título y descripción con «página n», canónica propia;
 * - con filtros u otro orden: no se indexa y la canónica es la página 1 sin
 *   filtros (`metadataFiltrada`).
 */
export async function metadataListadoNueva(
  tipo: TipoListadoNueva,
  slug: string | null,
  pagina: number,
  parametros: ParametrosURL,
): Promise<Metadata> {
  const ambito = await ambitoDe(tipo, slug);
  if (!ambito) return METADATA_404;
  const { titulo, seo } = ambito;
  const descripcionBase =
    ambito.descripcion?.trim() ||
    (tipo === "categoria"
      ? descripcionPorDefecto.categoriaNueva(ambito.nombre)
      : DESCRIPCION_NUEVA);

  let base: Metadata;
  if (pagina === 1) {
    base = await metadataDe({
      nombre: titulo,
      path: ambito.ruta(1),
      descripcion: descripcionBase,
      seo,
    });
  } else {
    const tituloBase = seo?.metaTitle?.trim() || titulo;
    const descripcion = seo?.metaDescription?.trim() || descripcionBase;
    base = await metadataDe({
      nombre: `${tituloBase} · página ${pagina}`,
      path: ambito.ruta(pagina),
      descripcion: descripcion ? `Página ${pagina}. ${descripcion}` : null,
      seo: { ...seo, metaTitle: null, metaDescription: null },
    });
  }

  const seleccion = depurar(
    leerSeleccion(parametros, CATALOGO_NUEVA),
    CATALOGO_NUEVA,
    ambito.equipos,
  );
  if (hayFiltros(seleccion, CATALOGO_NUEVA)) {
    return metadataFiltrada(base, absoluteUrl(ambito.ruta(1)), indexacionPermitida());
  }
  return base;
}

/** La URL de la página `pagina` de un listado, con su barra final. */
export function rutaDeListadoNueva(tipo: TipoListadoNueva, slug: string | null, pagina: number) {
  return `${tipo === "indice" ? rutas.nuevaPagina(pagina) : rutas.categoriaNuevaPagina(slug ?? "", pagina)}/`;
}

/**
 * `…/pagina/1/` no existe: la página 1 tiene una sola URL. Redirige (308) en
 * un solo salto, con su barra final y los parámetros que traiga.
 */
export function redirigirPaginaUnoNueva(
  tipo: TipoListadoNueva,
  slug: string | null,
  parametros: ParametrosURL,
): never {
  permanentRedirect(
    conConsulta(
      rutaDeListadoNueva(tipo, slug, 1),
      consultaRecibida(parametros, CATALOGO_NUEVA),
      otrosParametros(parametros, CATALOGO_NUEVA),
    ),
  );
}
