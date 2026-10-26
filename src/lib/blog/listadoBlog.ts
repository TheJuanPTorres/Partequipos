import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  conConsulta,
  consultaCanonica,
  consultaRecibida,
  depurar,
  leerSeleccion,
  otrosParametros,
  resolverListado,
  type Catalogo,
  type ParametrosURL,
} from "@/lib/filtros";
import { metadataFiltrada } from "@/lib/filtros";
import { ANIMACIONES_BLOG } from "@/lib/animacionesBlog";
import { activasDe, PARAMETRO_ANIMACIONES } from "@/lib/listado/animaciones";
import { getIndiceBlog } from "@/lib/queries/getBlog";
import { rutas } from "@/lib/routes";
import { absoluteUrl, indexacionPermitida } from "@/lib/seo/config";
import { metadataDe } from "@/lib/seo/metadata";

import {
  buscarEnArticulos,
  CATALOGO_BLOG,
  CLAVE_BUSQUEDA,
  leerBusqueda,
  POR_PAGINA_BLOG,
  PRIMERA_PAGINA_BLOG_CON_DESTACADO,
  type ArticuloLista,
} from "./indice";

/**
 * LO QUE DECIDE UNA PÁGINA DEL ÍNDICE DEL BLOG (2026-10-21), como
 * `src/lib/usados/listado.ts` lo hace con el marketplace: lee la URL, filtra,
 * redirige a la forma canónica y da la metadata. Dos ámbitos con la misma
 * plantilla:
 *
 * - el ÍNDICE (`/noticias/`), con el filtro de categorías;
 * - el ARCHIVO de una categoría (`/category/<slug>/`, la URL de WordPress que
 *   está indexada): solo los artículos de esa categoría, sin el filtro de
 *   categorías, porque la página YA es la categoría.
 *
 * Las páginas 2 en adelante cuelgan de `<ruta>/pagina/<n>/` (el patrón de
 * usados). Los filtros y la búsqueda van en la query y esas páginas no se
 * indexan; su canónica es la del ámbito sin filtros.
 */

export type AmbitoBlog = { tipo: "indice" } | { tipo: "categoria"; slug: string };

export function rutaDeBlog(ambito: AmbitoBlog, pagina: number): string {
  const base = ambito.tipo === "indice" ? rutas.blog() : rutas.categoriaBlog(ambito.slug);
  return pagina <= 1 ? base : `${base}/pagina/${pagina}`;
}

const SIN_FACETAS: Catalogo<ArticuloLista> = { facetas: [], ordenes: CATALOGO_BLOG.ordenes };

function catalogoDe(ambito: AmbitoBlog): Catalogo<ArticuloLista> {
  return ambito.tipo === "indice" ? CATALOGO_BLOG : SIN_FACETAS;
}

async function articulosDe(ambito: AmbitoBlog) {
  const { articulos, categorias } = await getIndiceBlog();
  if (ambito.tipo === "indice") return { articulos, categorias, categoria: null };
  const categoria = categorias.find((c) => c.slug === ambito.slug) ?? null;
  return {
    articulos: articulos.filter((a) => a.categoria?.slug === ambito.slug),
    categorias,
    categoria,
  };
}

/** La query de la búsqueda (`buscar=…`), codificada, o vacía. */
export function consultaDeBusqueda(busqueda: string): string {
  return busqueda ? `${CLAVE_BUSQUEDA}=${encodeURIComponent(busqueda).replace(/%20/g, "+")}` : "";
}

export async function cargarIndiceBlog(
  ambito: AmbitoBlog,
  pagina: number,
  parametros: ParametrosURL,
) {
  const { articulos, categorias, categoria } = await articulosDe(ambito);
  if (ambito.tipo === "categoria" && !categoria) notFound();

  const busqueda = leerBusqueda(parametros[CLAVE_BUSQUEDA]);
  const catalogo = catalogoDe(ambito);
  // Las mejoras N1–N4; en un preview se prueban con `?anim=` (nunca en el sitio publicado).
  const activas = activasDe(
    ANIMACIONES_BLOG,
    parametros[PARAMETRO_ANIMACIONES],
    process.env.VERCEL_ENV !== "production",
  );
  const listado = resolverListado({
    items: buscarEnArticulos(articulos, busqueda),
    parametros: { ...parametros, [CLAVE_BUSQUEDA]: undefined },
    catalogo,
    pagina,
    porPagina: POR_PAGINA_BLOG,
    // Con el destacado (N1), solo sin búsqueda ni filtros: 10 en la página 1; si no, 9.
    primeraPagina: (filtrado) =>
      activas.includes("N1") && busqueda === "" && !filtrado
        ? PRIMERA_PAGINA_BLOG_CON_DESTACADO
        : POR_PAGINA_BLOG,
    ruta: `${rutaDeBlog(ambito, pagina)}/`,
  });
  // `buscar` es texto libre y no una faceta: se reescribe aparte en la redirección.
  const bruto = parametros[CLAVE_BUSQUEDA];
  const busquedaNoCanonica =
    bruto !== undefined && (Array.isArray(bruto) || bruto === "" || bruto !== busqueda);
  if (listado.tipo === "redirigir" || (listado.tipo === "listado" && busquedaNoCanonica)) {
    const destino =
      listado.tipo === "redirigir"
        ? listado.destino
        : conConsulta(
            `${rutaDeBlog(ambito, pagina)}/`,
            listado.consulta,
            otrosSinBusqueda(parametros, catalogo),
          );
    const [ruta = "", resto = ""] = destino.split("?");
    permanentRedirect(conConsulta(ruta, resto, consultaDeBusqueda(busqueda)));
  }
  if (listado.tipo === "no-existe") notFound();
  return {
    listado,
    catalogo,
    categorias,
    categoria,
    busqueda,
    activas,
    totalArticulos: articulos.length,
  };
}

/** Los parámetros desconocidos (`utm_…`) sin `buscar`, que es nuestro. */
function otrosSinBusqueda(parametros: ParametrosURL, catalogo: Catalogo<ArticuloLista>): string {
  return otrosParametros({ ...parametros, [CLAVE_BUSQUEDA]: undefined }, catalogo);
}

/**
 * La metadata: la página 1 sin filtros, la de siempre; la n, con «página n»;
 * con filtros o búsqueda, `noindex` y canónica a la página 1 sin filtros.
 */
export async function metadataIndiceBlog(
  ambito: AmbitoBlog,
  pagina: number,
  parametros: ParametrosURL,
): Promise<Metadata> {
  let nombre = "Noticias";
  let descripcion: string | null =
    "Novedades, guías técnicas y tendencias de maquinaria pesada, repuestos y mantenimiento.";
  let seo = undefined;
  if (ambito.tipo === "categoria") {
    const { getCategoriaBlogPorSlug } = await import("@/lib/queries/getBlog");
    const categoria = await getCategoriaBlogPorSlug(ambito.slug);
    if (!categoria) return { title: "Página no encontrada | Partequipos" };
    nombre = categoria.nombre;
    descripcion = categoria.descripcion ?? null;
    seo = categoria.seo;
  }
  const base = await metadataDe({
    nombre: pagina === 1 ? nombre : `${nombre} · página ${pagina}`,
    path: rutaDeBlog(ambito, pagina),
    descripcion: pagina === 1 || !descripcion ? descripcion : `Página ${pagina}. ${descripcion}`,
    seo: pagina === 1 ? seo : { ...seo, metaTitle: null, metaDescription: null },
  });

  const { articulos } = await articulosDe(ambito);
  const catalogo = catalogoDe(ambito);
  const seleccion = depurar(leerSeleccion(parametros, catalogo), catalogo, articulos);
  const filtrado =
    consultaCanonica(seleccion, catalogo) !== "" || leerBusqueda(parametros[CLAVE_BUSQUEDA]) !== "";
  return filtrado
    ? metadataFiltrada(base, absoluteUrl(rutaDeBlog(ambito, 1)), indexacionPermitida())
    : base;
}

/** `…/pagina/1/` no existe: redirige (308) a la página 1 con lo que traiga. */
export function redirigirPaginaUnoBlog(ambito: AmbitoBlog, parametros: ParametrosURL): never {
  const catalogo = catalogoDe(ambito);
  permanentRedirect(
    conConsulta(
      `${rutaDeBlog(ambito, 1)}/`,
      consultaRecibida({ ...parametros, [CLAVE_BUSQUEDA]: undefined }, catalogo),
      consultaDeBusqueda(leerBusqueda(parametros[CLAVE_BUSQUEDA])),
      otrosSinBusqueda(parametros, catalogo),
    ),
  );
}
