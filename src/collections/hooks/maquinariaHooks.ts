import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import {
  revalidarRutas,
  rutasDeCategoriaNueva,
  rutasDeCategoriaUsada,
  rutasDeEquipoNuevo,
  rutasDeMarcaMaquinaria,
  rutasDeTipoMaquinaria,
} from "@/lib/revalidation";
import { poblado } from "@/lib/utils/relations";

/**
 * Hooks de revalidación de maquinaria (ISR). Mismo grafo que en repuestos; ver
 * `src/lib/revalidation.ts`.
 *
 * Regla transversal: ninguna de estas funciones puede romper el guardado. Todo
 * va en try/catch y nunca se relanza el error.
 */

async function slugPorId(
  req: PayloadRequest,
  collection: "marcas-maquinaria" | "tipos-maquinaria",
  rel: unknown,
): Promise<string | null> {
  const doc = poblado<{ id: number; slug: string }>(rel as number | { id: number; slug: string });
  if (doc?.slug) return doc.slug;
  if (typeof rel !== "number") return null;

  const encontrado = await req.payload.findByID({
    collection,
    id: rel,
    depth: 0,
    disableErrors: true,
  });
  return encontrado && "slug" in encontrado ? String(encontrado.slug) : null;
}

async function equiposDeTipo(req: PayloadRequest, tipoId: number): Promise<string[]> {
  const { docs } = await req.payload.find({
    collection: "equipos-nuevos",
    where: { tipo: { equals: tipoId } },
    depth: 0,
    limit: 0,
  });
  return docs.map((d) => d.slug);
}

async function hijosDeMarca(req: PayloadRequest, marcaId: number) {
  const { docs: tipos } = await req.payload.find({
    collection: "tipos-maquinaria",
    where: { marca: { equals: marcaId } },
    depth: 0,
    limit: 0,
  });
  return Promise.all(
    tipos.map(async (tipo) => ({
      tipoSlug: tipo.slug,
      equipoSlugs: await equiposDeTipo(req, tipo.id),
    })),
  );
}

/** Slugs de todas las categorías transversales: un equipo puede aparecer en varias. */
async function todasLasCategorias(req: PayloadRequest): Promise<string[]> {
  const { docs } = await req.payload.find({
    collection: "categorias-maquinaria",
    depth: 0,
    limit: 0,
  });
  return docs.map((d) => d.slug);
}

export const revalidarMarcaMaquinaria: CollectionAfterChangeHook = async ({ doc, req }) => {
  try {
    revalidarRutas(
      rutasDeMarcaMaquinaria(doc.slug, await hijosDeMarca(req, doc.id)),
      `marca maquinaria ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de MarcaMaquinaria falló:", error);
  }
  return doc;
};

export const revalidarMarcaMaquinariaBorrada: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    const hijos = await hijosDeMarca(req, doc.id).catch(() => []);
    revalidarRutas(rutasDeMarcaMaquinaria(doc.slug, hijos), `marca maquinaria borrada ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de borrado de MarcaMaquinaria falló:", error);
  }
  return doc;
};

export const revalidarTipoMaquinaria: CollectionAfterChangeHook = async ({ doc, req }) => {
  try {
    const marcaSlug = await slugPorId(req, "marcas-maquinaria", doc.marca);
    if (!marcaSlug) return doc;

    revalidarRutas(
      rutasDeTipoMaquinaria(marcaSlug, doc.slug, await equiposDeTipo(req, doc.id)),
      `tipo maquinaria ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de TipoMaquinaria falló:", error);
  }
  return doc;
};

export const revalidarTipoMaquinariaBorrado: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    const marcaSlug = await slugPorId(req, "marcas-maquinaria", doc.marca);
    if (!marcaSlug) return doc;

    const equipos = await equiposDeTipo(req, doc.id).catch(() => []);
    revalidarRutas(
      rutasDeTipoMaquinaria(marcaSlug, doc.slug, equipos),
      `tipo maquinaria borrado ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de borrado de TipoMaquinaria falló:", error);
  }
  return doc;
};

/** Id del tipo de un equipo, venga poblado o como id. */
function idDeTipo(rel: unknown): number | null {
  const tipo = poblado<{ id: number }>(rel as number | { id: number });
  if (tipo?.id) return tipo.id;
  return typeof rel === "number" ? rel : null;
}

/** Fichas de los demás equipos del tipo: lo enseñan en «Otras referencias». */
async function hermanosDe(req: PayloadRequest, doc: { slug: string; tipo: unknown }) {
  const tipoId = idDeTipo(doc.tipo);
  if (!tipoId) return [];
  return (await equiposDeTipo(req, tipoId)).filter((slug) => slug !== doc.slug);
}

export const revalidarEquipoNuevo: CollectionAfterChangeHook = async ({ doc, req }) => {
  try {
    const marcaSlug = await slugPorId(req, "marcas-maquinaria", doc.marca);
    const tipoSlug = await slugPorId(req, "tipos-maquinaria", doc.tipo);
    if (!marcaSlug || !tipoSlug) return doc;

    revalidarRutas(
      rutasDeEquipoNuevo(
        marcaSlug,
        tipoSlug,
        doc.slug,
        await todasLasCategorias(req),
        await hermanosDe(req, doc),
      ),
      `equipo nuevo ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de EquipoNuevo falló:", error);
  }
  return doc;
};

/**
 * Un documento PDF cambiado (un fichero nuevo lleva otro nombre, §10.32):
 * se revalidan las fichas que lo enlazan y las de su tipo, que enlazan su PDF
 * desde «Otras referencias».
 */
export const revalidarDocumento: CollectionAfterChangeHook = async ({ doc, req }) => {
  try {
    const { docs } = await req.payload.find({
      collection: "equipos-nuevos",
      where: { fichaTecnicaPdf: { equals: doc.id } },
      depth: 0,
      limit: 0,
    });
    for (const equipo of docs) {
      const marcaSlug = await slugPorId(req, "marcas-maquinaria", equipo.marca);
      const tipoSlug = await slugPorId(req, "tipos-maquinaria", equipo.tipo);
      if (!marcaSlug || !tipoSlug) continue;
      revalidarRutas(
        rutasDeEquipoNuevo(marcaSlug, tipoSlug, equipo.slug, [], await hermanosDe(req, equipo)),
        `documento ${doc.id}`,
      );
    }
  } catch (error) {
    console.error("[revalidación] hook de Documento falló:", error);
  }
  return doc;
};

export const revalidarEquipoNuevoBorrado: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    const marcaSlug = await slugPorId(req, "marcas-maquinaria", doc.marca);
    const tipoSlug = await slugPorId(req, "tipos-maquinaria", doc.tipo);
    if (!marcaSlug || !tipoSlug) return doc;

    const categorias = await todasLasCategorias(req).catch(() => []);
    const hermanos = await hermanosDe(req, doc).catch(() => []);
    revalidarRutas(
      rutasDeEquipoNuevo(marcaSlug, tipoSlug, doc.slug, categorias, hermanos),
      `equipo nuevo borrado ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de borrado de EquipoNuevo falló:", error);
  }
  return doc;
};

/*
 * Las categorías (nueva y usada) revalidan lo mismo al crear, editar o borrar,
 * pero `afterChange` y `afterDelete` tienen firmas distintas: se comparte el
 * cuerpo y se exportan dos constantes tipadas.
 */
function revalidarCategoriaNuevaCore(doc: { slug: string }) {
  try {
    revalidarRutas(rutasDeCategoriaNueva(doc.slug), `categoría nueva ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de CategoriaMaquinaria falló:", error);
  }
  return doc;
}

function revalidarCategoriaUsadaCore(doc: { slug: string }) {
  try {
    revalidarRutas(rutasDeCategoriaUsada(doc.slug), `categoría usada ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de CategoriaUsada falló:", error);
  }
  return doc;
}

export const revalidarCategoriaNueva: CollectionAfterChangeHook = ({ doc }) =>
  revalidarCategoriaNuevaCore(doc);

export const revalidarCategoriaNuevaBorrada: CollectionAfterDeleteHook = ({ doc }) =>
  revalidarCategoriaNuevaCore(doc);

export const revalidarCategoriaUsada: CollectionAfterChangeHook = ({ doc }) =>
  revalidarCategoriaUsadaCore(doc);

export const revalidarCategoriaUsadaBorrada: CollectionAfterDeleteHook = ({ doc }) =>
  revalidarCategoriaUsadaCore(doc);

/** Una unidad de inventario solo afecta a la página de su categoría. */
async function revalidarEquipoUsadoCore(
  doc: { id: number; categoria: unknown },
  req: PayloadRequest,
) {
  try {
    const categoria = poblado<{ id: number; slug: string }>(
      doc.categoria as number | { id: number; slug: string },
    );
    const categoriaSlug =
      categoria?.slug ??
      (typeof doc.categoria === "number"
        ? ((
            await req.payload.findByID({
              collection: "categorias-usada",
              id: doc.categoria,
              depth: 0,
              disableErrors: true,
            })
          )?.slug ?? null)
        : null);

    if (categoriaSlug) {
      revalidarRutas(rutasDeCategoriaUsada(categoriaSlug), `equipo usado ${doc.id}`);
    }
  } catch (error) {
    console.error("[revalidación] hook de EquipoUsado falló:", error);
  }
  return doc;
}

export const revalidarEquipoUsado: CollectionAfterChangeHook = ({ doc, req }) =>
  revalidarEquipoUsadoCore(doc, req);

export const revalidarEquipoUsadoBorrado: CollectionAfterDeleteHook = ({ doc, req }) =>
  revalidarEquipoUsadoCore(doc, req);
