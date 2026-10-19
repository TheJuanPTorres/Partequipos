import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import {
  conConsulta,
  consultaRecibida,
  depurar,
  hayFiltros,
  leerSeleccion,
  metadataFiltrada,
  metadataSinIndexar,
  otrosParametros,
  resolverListado,
  type Catalogo,
  type ParametrosURL,
} from "../filtros";
import {
  getCategoriasUsada,
  getCategoriaUsadaPorSlug,
  getInventarioUsados,
  getMarcaUsadaPorSlug,
  getUnidadesDeCategoriaUsada,
  getUnidadesDeMarcaUsada,
  type UnidadUsada,
} from "../queries/getMaquinaria";
import { rutas } from "../routes";
import { absoluteUrl, indexacionPermitida } from "../seo/config";
import { metadataDe } from "../seo/metadata";
import { METADATA_404 } from "../seo/noEncontrada";
import { descripcionPorDefecto, tituloPorDefecto } from "../seo/porDefecto";
import { CATALOGO_USADOS, CATALOGO_USADOS_MARCA, type UnidadFiltrable } from "./filtros";
import { POR_PAGINA } from "./paginacion";
import { pestanasDeCategorias, type PestanaListado } from "./pestanas";

/**
 * Los listados de USADA con filtros: el de una CATEGORÍA
 * (`/…/maquinaria-pesada-usada/<categoria>/`) y el de una MARCA
 * (`/…/maquinaria-pesada-usada/marcas/<marca>/`), cada uno con su paginación
 * (`…/pagina/<n>/`).
 *
 * Son DINÁMICOS (leen la query de la URL; decisión D3 de dirección,
 * 2026-10-13) y sus datos salen de la caché de datos.
 */
export type TipoListadoUsado = "categoria" | "marca";

type Registro = {
  slug: string;
  nombre: string;
  descripcion?: string | null;
  seo?: { metaTitle?: string | null; metaDescription?: string | null } | null;
};

/** Lo que cambia entre un listado de categoría y uno de marca. */
export type Ambito = {
  tipo: TipoListadoUsado;
  registro: Registro;
  /** El `<h1>` y el título por defecto. */
  titulo: string;
  catalogo: Catalogo<UnidadFiltrable>;
  unidades: UnidadUsada[];
  /** Ruta de la página n, sin barra final (la 1 es la del registro). */
  ruta: (pagina: number) => string;
  indexable: boolean;
  /** Enlaces a la misma marca en otras líneas (solo en las marcas). */
  enlaces: { href: string; texto: string }[];
  /**
   * Pestañas de la plantilla (solo en las categorías): las categorías con
   * unidades, por nombre, y la propia aunque esté vacía.
   */
  pestanas: PestanaListado[];
};

const slugPoblado = (v: unknown): string | null =>
  v && typeof v === "object" && "slug" in v && typeof (v as { slug: unknown }).slug === "string"
    ? (v as { slug: string }).slug
    : null;

async function ambitoDe(tipo: TipoListadoUsado, slug: string): Promise<Ambito | null> {
  if (tipo === "categoria") {
    const categoria = await getCategoriaUsadaPorSlug(slug);
    if (!categoria) return null;
    const [unidades, categorias, inventario] = await Promise.all([
      getUnidadesDeCategoriaUsada(categoria.id),
      getCategoriasUsada(),
      getInventarioUsados(),
    ]);
    return {
      tipo,
      registro: categoria,
      titulo: tituloPorDefecto.categoriaUsada(categoria.nombre),
      catalogo: CATALOGO_USADOS,
      unidades,
      ruta: (n) => rutas.categoriaUsadaPagina(categoria.slug, n),
      // Sin unidades, no se indexa; vuelve sola con la primera (D4).
      indexable: unidades.length > 0,
      enlaces: [],
      pestanas: pestanasDeCategorias(
        categorias,
        new Set(inventario.map((u) => u.categoria)),
        categoria.id,
      ),
    };
  }
  const marca = await getMarcaUsadaPorSlug(slug);
  if (!marca) return null;
  const unidades = await getUnidadesDeMarcaUsada(marca.id);
  return {
    tipo,
    registro: marca,
    titulo: tituloPorDefecto.marcaUsada(marca.nombre),
    catalogo: CATALOGO_USADOS_MARCA,
    unidades,
    ruta: (n) => rutas.marcaUsadaPagina(marca.slug, n),
    // Sin unidades, no se indexa (D4).
    indexable: unidades.length > 0,
    enlaces: [
      ...(slugPoblado(marca.marcaNueva)
        ? [
            {
              href: `${rutas.marcaMaquinaria(slugPoblado(marca.marcaNueva)!)}/`,
              texto: `Maquinaria ${marca.nombre} nueva`,
            },
          ]
        : []),
      ...(slugPoblado(marca.marcaRepuestos)
        ? [
            {
              href: `${rutas.marca(slugPoblado(marca.marcaRepuestos)!)}/`,
              texto: `Repuestos ${marca.nombre}`,
            },
          ]
        : []),
    ],
    pestanas: [],
  };
}

/** La URL de la página `pagina` de un listado, con su barra final. */
export function rutaDeListadoUsado(tipo: TipoListadoUsado, slug: string, pagina: number): string {
  return `${tipo === "categoria" ? rutas.categoriaUsadaPagina(slug, pagina) : rutas.marcaUsadaPagina(slug, pagina)}/`;
}

/**
 * Lo que pinta la página: el ámbito y el listado resuelto. Redirige (308) si
 * la query no está en su forma canónica, y da 404 si el registro no existe o
 * esa página no existe con esa selección.
 */
export async function cargarListadoUsado(
  tipo: TipoListadoUsado,
  slug: string,
  pagina: number,
  parametros: ParametrosURL,
) {
  const ambito = await ambitoDe(tipo, slug);
  if (!ambito) notFound();
  const listado = resolverListado({
    items: ambito.unidades,
    parametros,
    catalogo: ambito.catalogo,
    pagina,
    porPagina: POR_PAGINA,
    ruta: `${ambito.ruta(pagina)}/`,
  });
  if (listado.tipo === "redirigir") permanentRedirect(listado.destino);
  if (listado.tipo === "no-existe") notFound();
  return { ambito, listado };
}

/**
 * La metadata de una página del listado:
 * - página 1 sin filtros: la del registro (su SEO o el título por defecto);
 * - página n sin filtros: título y descripción con «página n», canónica propia;
 * - con filtros u otro orden: no se indexa, y la canónica es la página 1 sin
 *   filtros (`metadataFiltrada`);
 * - sin unidades: no se indexa (D4), aunque la categoría sea heredada del
 *   sitio actual; con la primera unidad vuelve a indexarse sola.
 */
export async function metadataListadoUsado(
  tipo: TipoListadoUsado,
  slug: string,
  pagina: number,
  parametros: ParametrosURL,
): Promise<Metadata> {
  const ambito = await ambitoDe(tipo, slug);
  if (!ambito) return METADATA_404;
  const { registro, titulo } = ambito;
  // Sin descripción del registro, la propia del marketplace (no la general
  // del sitio, que habla de repuestos). La misma que enseña el panel.
  const descripcionBase =
    registro.descripcion?.trim() ||
    (tipo === "categoria"
      ? descripcionPorDefecto.categoriaUsada(registro.nombre)
      : descripcionPorDefecto.marcaUsada(registro.nombre));

  let base: Metadata;
  if (pagina === 1) {
    base = await metadataDe({
      nombre: titulo,
      path: ambito.ruta(1),
      descripcion: descripcionBase,
      seo: registro.seo,
    });
  } else {
    // Sin «página n», Google vería varias URL con el mismo título.
    const tituloBase = registro.seo?.metaTitle?.trim() || titulo;
    const descripcion = registro.seo?.metaDescription?.trim() || descripcionBase;
    base = await metadataDe({
      nombre: `${tituloBase} · página ${pagina}`,
      path: ambito.ruta(pagina),
      descripcion: descripcion ? `Página ${pagina}. ${descripcion}` : null,
      seo: { ...registro.seo, metaTitle: null, metaDescription: null },
    });
  }

  const seleccion = depurar(
    leerSeleccion(parametros, ambito.catalogo),
    ambito.catalogo,
    ambito.unidades,
  );
  if (hayFiltros(seleccion, ambito.catalogo)) {
    return metadataFiltrada(base, absoluteUrl(ambito.ruta(1)), indexacionPermitida());
  }
  if (!ambito.indexable) return metadataSinIndexar(base, indexacionPermitida());
  return base;
}

/**
 * `…/pagina/1/` no existe: la página 1 tiene una sola URL, la del registro.
 * Redirige (308) en un solo salto, con su barra final y los parámetros que
 * traiga; con la barra, `trailingSlash` no añade un segundo salto.
 */
export function redirigirPaginaUno(
  tipo: TipoListadoUsado,
  slug: string,
  parametros: ParametrosURL,
): never {
  const catalogo = tipo === "categoria" ? CATALOGO_USADOS : CATALOGO_USADOS_MARCA;
  permanentRedirect(
    conConsulta(
      rutaDeListadoUsado(tipo, slug, 1),
      consultaRecibida(parametros, catalogo),
      otrosParametros(parametros, catalogo),
    ),
  );
}
