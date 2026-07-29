import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from "payload";

import { revalidarRutas, rutasDeMarca, rutasDeModelo, rutasDeTipo } from "@/lib/revalidation";
import { rutas } from "@/lib/routes";
import { poblado } from "@/lib/utils/relations";
import type { Marca, TiposEquipo } from "@/payload-types";

import { crearRedirectPorCambioDeSlug } from "./autoRedirect";

/**
 * Hooks de revalidación (ISR). Ver el grafo de dependencias y la justificación
 * de `revalidatePath` en `src/lib/revalidation.ts`.
 *
 * Regla transversal: **ninguna de estas funciones puede romper el guardado**.
 * Todo el cuerpo va dentro de try/catch y nunca se relanza el error; si la
 * revalidación falla, el documento ya quedó guardado igualmente (criterio 5).
 */

/** Slug de una relación que puede venir como id o como documento poblado. */
async function slugDeRelacion<T extends { id: number; slug: string }>(
  req: PayloadRequest,
  collection: "marcas" | "tipos-equipo",
  rel: number | T | null | undefined,
): Promise<string | null> {
  const doc = poblado<T>(rel);
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

/** Slugs de los tipos de una marca, con los slugs de sus modelos. */
async function hijosDeMarca(req: PayloadRequest, marcaId: number) {
  const { docs: tipos } = await req.payload.find({
    collection: "tipos-equipo",
    where: { marca: { equals: marcaId } },
    depth: 0,
    limit: 0,
  });

  return Promise.all(
    tipos.map(async (tipo) => ({
      tipoSlug: tipo.slug,
      modeloSlugs: await modelosDeTipo(req, tipo.id),
    })),
  );
}

/** Slugs de los modelos de un tipo. */
async function modelosDeTipo(req: PayloadRequest, tipoId: number): Promise<string[]> {
  const { docs } = await req.payload.find({
    collection: "modelos-repuesto",
    where: { tipo: { equals: tipoId } },
    depth: 0,
    limit: 0,
  });
  return docs.map((modelo) => modelo.slug);
}

// ---------------------------------------------------------------------------
// MARCA
// ---------------------------------------------------------------------------
export const revalidarMarca: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const hijos = await hijosDeMarca(req, doc.id);
    const paths = rutasDeMarca(doc.slug, hijos);

    // Si el slug cambió, la ruta anterior y todo su subárbol quedan obsoletos.
    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      paths.push(...rutasDeMarca(previousDoc.slug, hijos));

      // ADR 0005: salvar las URLs indexadas con un 301 (la marca y su subárbol).
      await crearRedirectPorCambioDeSlug(req, rutas.marca(previousDoc.slug), rutas.marca(doc.slug));
      for (const { tipoSlug, modeloSlugs } of hijos) {
        await crearRedirectPorCambioDeSlug(
          req,
          rutas.tipo(previousDoc.slug, tipoSlug),
          rutas.tipo(doc.slug, tipoSlug),
        );
        for (const modeloSlug of modeloSlugs) {
          await crearRedirectPorCambioDeSlug(
            req,
            rutas.modelo(previousDoc.slug, tipoSlug, modeloSlug),
            rutas.modelo(doc.slug, tipoSlug, modeloSlug),
          );
        }
      }
    }

    revalidarRutas(paths, `marca ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de Marca falló:", error);
  }
  return doc;
};

export const revalidarMarcaBorrada: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    // Los hijos ya pueden no existir; se revalidan al menos los índices y su página.
    const hijos = await hijosDeMarca(req, doc.id).catch(() => []);
    revalidarRutas(rutasDeMarca(doc.slug, hijos), `marca borrada ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de borrado de Marca falló:", error);
  }
  return doc;
};

// ---------------------------------------------------------------------------
// TIPO DE EQUIPO
// ---------------------------------------------------------------------------
export const revalidarTipo: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const marcaSlug = await slugDeRelacion<Marca>(req, "marcas", doc.marca);
    if (!marcaSlug) return doc;

    const modeloSlugs = await modelosDeTipo(req, doc.id);
    const paths = rutasDeTipo(marcaSlug, doc.slug, modeloSlugs);

    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      paths.push(...rutasDeTipo(marcaSlug, previousDoc.slug, modeloSlugs));

      // ADR 0005: 301 del tipo y de las fichas que colgaban de él.
      await crearRedirectPorCambioDeSlug(
        req,
        rutas.tipo(marcaSlug, previousDoc.slug),
        rutas.tipo(marcaSlug, doc.slug),
      );
      for (const modeloSlug of modeloSlugs) {
        await crearRedirectPorCambioDeSlug(
          req,
          rutas.modelo(marcaSlug, previousDoc.slug, modeloSlug),
          rutas.modelo(marcaSlug, doc.slug, modeloSlug),
        );
      }
    }

    // Si el tipo se movió de marca, la marca anterior también cambia su listado.
    const marcaAnterior = await slugDeRelacion<Marca>(req, "marcas", previousDoc?.marca);
    if (marcaAnterior && marcaAnterior !== marcaSlug) {
      paths.push(...rutasDeTipo(marcaAnterior, previousDoc.slug ?? doc.slug, modeloSlugs));
    }

    revalidarRutas(paths, `tipo ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de TipoEquipo falló:", error);
  }
  return doc;
};

export const revalidarTipoBorrado: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    const marcaSlug = await slugDeRelacion<Marca>(req, "marcas", doc.marca);
    if (!marcaSlug) return doc;

    const modeloSlugs = await modelosDeTipo(req, doc.id).catch(() => []);
    revalidarRutas(rutasDeTipo(marcaSlug, doc.slug, modeloSlugs), `tipo borrado ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de borrado de TipoEquipo falló:", error);
  }
  return doc;
};

// ---------------------------------------------------------------------------
// MODELO DE REPUESTO
// ---------------------------------------------------------------------------
/** Resuelve marca y tipo de un modelo, para construir su ruta completa. */
async function contextoDeModelo(
  req: PayloadRequest,
  modelo: { marca?: unknown; tipo?: unknown },
): Promise<{ marcaSlug: string; tipoSlug: string } | null> {
  const marcaSlug = await slugDeRelacion<Marca>(
    req,
    "marcas",
    modelo.marca as number | Marca | null,
  );
  const tipoSlug = await slugDeRelacion<TiposEquipo>(
    req,
    "tipos-equipo",
    modelo.tipo as number | TiposEquipo | null,
  );

  return marcaSlug && tipoSlug ? { marcaSlug, tipoSlug } : null;
}

export const revalidarModelo: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const actual = await contextoDeModelo(req, doc);
    if (!actual) return doc;

    const paths = rutasDeModelo(actual.marcaSlug, actual.tipoSlug, doc.slug);

    // Ruta anterior: cubre cambio de slug y también cambio de tipo/marca
    // (el modelo se movió de sitio y su URL vieja queda obsoleta).
    if (previousDoc) {
      const anterior = await contextoDeModelo(req, previousDoc);
      if (anterior) {
        const slugAnterior = previousDoc.slug ?? doc.slug;
        paths.push(...rutasDeModelo(anterior.marcaSlug, anterior.tipoSlug, slugAnterior));

        // ADR 0005: si la URL de la ficha cambió, salvarla con un 301.
        await crearRedirectPorCambioDeSlug(
          req,
          rutas.modelo(anterior.marcaSlug, anterior.tipoSlug, slugAnterior),
          rutas.modelo(actual.marcaSlug, actual.tipoSlug, doc.slug),
        );
      }
    }

    revalidarRutas(paths, `modelo ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de ModeloRepuesto falló:", error);
  }
  return doc;
};

export const revalidarModeloBorrado: CollectionAfterDeleteHook = async ({ doc, req }) => {
  try {
    const actual = await contextoDeModelo(req, doc);
    if (!actual) return doc;

    revalidarRutas(
      rutasDeModelo(actual.marcaSlug, actual.tipoSlug, doc.slug),
      `modelo borrado ${doc.slug}`,
    );
  } catch (error) {
    console.error("[revalidación] hook de borrado de ModeloRepuesto falló:", error);
  }
  return doc;
};

// ---------------------------------------------------------------------------
// PÁGINAS INSTITUCIONALES
// ---------------------------------------------------------------------------
/** Ruta pública de una página institucional; "inicio" es la portada. */
function rutaDePagina(slug: string): string {
  const limpio = (slug ?? "").replace(/^\/+|\/+$/g, "");
  return limpio === "inicio" || limpio === "" ? "/" : `/${limpio}`;
}

export const revalidarPagina: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  try {
    const paths = [rutaDePagina(doc.slug)];

    if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
      const anterior = rutaDePagina(previousDoc.slug);
      paths.push(anterior);
      // ADR 0005: salvar la URL anterior con un 301.
      await crearRedirectPorCambioDeSlug(req, anterior, rutaDePagina(doc.slug));
    }

    revalidarRutas(paths, `página ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de PaginaInstitucional falló:", error);
  }
  return doc;
};

export const revalidarPaginaBorrada: CollectionAfterDeleteHook = ({ doc }) => {
  try {
    revalidarRutas([rutaDePagina(doc.slug)], `página borrada ${doc.slug}`);
  } catch (error) {
    console.error("[revalidación] hook de borrado de PaginaInstitucional falló:", error);
  }
  return doc;
};
