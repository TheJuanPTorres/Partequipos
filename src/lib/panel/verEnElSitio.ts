import type { CollectionSlug, GeneratePreviewURL, PayloadRequest } from "payload";

import { rutas } from "../routes";

/**
 * «Ver en el sitio»: la dirección pública de un documento, para el botón del
 * formulario del panel (`admin.preview` de Payload, que pinta un enlace con
 * `target="_blank"`).
 *
 * La ruta es RELATIVA a propósito: el panel y el sitio son la misma app, así
 * que el enlace abre la página del mismo despliegue —el preview en un preview,
 * producción en producción— sin depender de `NEXT_PUBLIC_SERVER_URL`, que en
 * los previews apunta a producción (CLAUDE.md §10.21).
 *
 * Solo colecciones con página propia. Sin slug (o con una relación que no se
 * encuentra) no hay botón: mejor eso que un enlace a un 404.
 */

type Doc = Record<string, unknown>;
/** Busca un documento relacionado por id y devuelve su slug, o null. */
export type BuscarSlug = (coleccion: CollectionSlug, id: number | string) => Promise<string | null>;

function slugPropio(doc: Doc): string | null {
  return typeof doc.slug === "string" && doc.slug.trim() ? doc.slug.trim() : null;
}

/** Slug de una relación, venga como id o como documento (con `depth`). */
async function slugDe(
  valor: unknown,
  coleccion: CollectionSlug,
  buscar: BuscarSlug,
): Promise<string | null> {
  if (valor && typeof valor === "object") {
    const rel = valor as { slug?: unknown; id?: unknown };
    if (typeof rel.slug === "string" && rel.slug) return rel.slug;
    if (typeof rel.id === "number" || typeof rel.id === "string") return buscar(coleccion, rel.id);
    return null;
  }
  if (typeof valor === "number" || typeof valor === "string") return buscar(coleccion, valor);
  return null;
}

/** Ruta de una página institucional: `inicio` es la portada. */
export function rutaDePagina(slug: string): string {
  const limpio = slug.replace(/^\/+|\/+$/g, "");
  return limpio === "inicio" || limpio === "" ? "/" : `/${limpio}`;
}

type Generador = (doc: Doc, buscar: BuscarSlug) => Promise<string | null>;

/** Una entrada por colección con página pública. */
export const RUTAS_EN_EL_SITIO: Partial<Record<CollectionSlug, Generador>> = {
  marcas: async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.marca(s) : null;
  },
  "tipos-equipo": async (doc, buscar) => {
    const s = slugPropio(doc);
    const marca = await slugDe(doc.marca, "marcas", buscar);
    return s && marca ? rutas.tipo(marca, s) : null;
  },
  "modelos-repuesto": async (doc, buscar) => {
    const s = slugPropio(doc);
    const marca = await slugDe(doc.marca, "marcas", buscar);
    const tipo = await slugDe(doc.tipo, "tipos-equipo", buscar);
    return s && marca && tipo ? rutas.modelo(marca, tipo, s) : null;
  },
  "marcas-maquinaria": async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.marcaMaquinaria(s) : null;
  },
  "tipos-maquinaria": async (doc, buscar) => {
    const s = slugPropio(doc);
    const marca = await slugDe(doc.marca, "marcas-maquinaria", buscar);
    return s && marca ? rutas.tipoMaquinaria(marca, s) : null;
  },
  "equipos-nuevos": async (doc, buscar) => {
    const s = slugPropio(doc);
    const marca = await slugDe(doc.marca, "marcas-maquinaria", buscar);
    const tipo = await slugDe(doc.tipo, "tipos-maquinaria", buscar);
    return s && marca && tipo ? rutas.equipoNuevo(marca, tipo, s) : null;
  },
  "categorias-maquinaria": async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.categoriaNueva(s) : null;
  },
  "categorias-usada": async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.categoriaUsada(s) : null;
  },
  "marcas-lubricante": async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.marcaLubricante(s) : null;
  },
  "categorias-lubricante": async (doc, buscar) => {
    const s = slugPropio(doc);
    const marca = await slugDe(doc.marca, "marcas-lubricante", buscar);
    return s && marca ? rutas.categoriaLubricante(marca, s) : null;
  },
  "categorias-blog": async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.categoriaBlog(s) : null;
  },
  articulos: async (doc) => {
    const s = slugPropio(doc);
    return s ? rutas.articulo(s) : null;
  },
  paginas: async (doc) => {
    const s = slugPropio(doc);
    return s ? rutaDePagina(s) : null;
  },
};

/** Ruta pública del documento, con la barra final del sitio, o null. */
export async function rutaEnElSitio(
  coleccion: CollectionSlug,
  doc: Doc,
  buscar: BuscarSlug,
): Promise<string | null> {
  const generar = RUTAS_EN_EL_SITIO[coleccion];
  if (!generar) return null;
  const ruta = await generar(doc, buscar);
  if (!ruta) return null;
  return ruta.endsWith("/") ? ruta : `${ruta}/`;
}

/** `admin.preview` para una colección: busca las relaciones con la API local. */
export function verEnElSitio(coleccion: CollectionSlug): GeneratePreviewURL {
  return (doc, { req }) =>
    rutaEnElSitio(coleccion, doc, async (c, id) => {
      const d = (await (req as PayloadRequest).payload.findByID({
        collection: c,
        id,
        depth: 0,
        disableErrors: true,
        req,
      })) as { slug?: unknown } | null;
      return d && typeof d.slug === "string" && d.slug ? d.slug : null;
    });
}
