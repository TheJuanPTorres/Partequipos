import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  SanitizedPermissions,
  TypedUser,
  Where,
} from "payload";

import { motivoAltFlojo } from "../media/altFlojo";
import {
  avisosDePortada,
  CON_GALERIA,
  FUERA_DE_RECIENTES,
  rutaGlobal,
  tarjetasDePortada,
  ultimosModificados,
  type AvisoPortada,
  type ConGaleria,
  type EntidadPortada,
  type Reciente,
  type Tarjeta,
} from "../panel/portada";
import { indexacionPermitida } from "../seo/config";

type Visibles = { collections: string[]; globals: string[] };

export type DatosPortada = {
  avisos: AvisoPortada[];
  tarjetas: Tarjeta[];
  recientes: Reciente[];
};

const texto = (v: unknown, respaldo: string) => (typeof v === "string" && v ? v : respaldo);

/**
 * Datos de la portada propia del panel (F2, decisiones-panel.md §23).
 *
 * TODO con el acceso del usuario (`overrideAccess: false` y su `user`): cada
 * uno cuenta y ve solo lo que puede leer, y lo que no puede leer ni se pide.
 *
 * Ligero a propósito: los contadores son `count` (un COUNT en la base, sin
 * documentos) y «lo último modificado» pide solo el título y la fecha
 * (`select`). La única lectura de filas completas es la de textos
 * alternativos (`alt` y `filename` de Imágenes), la misma que ya hace la lista
 * de Imágenes. De «solicitudes» solo se cuenta: el total y las nuevas.
 */
export async function getPortadaPanel(
  payload: Payload,
  user: TypedUser,
  permissions: SanitizedPermissions,
  visibles: Visibles,
): Promise<DatosPortada> {
  const puedeLeer = (slug: string) =>
    visibles.collections.includes(slug) &&
    Boolean(permissions.collections?.[slug as CollectionSlug]?.read);
  const acceso = { overrideAccess: false, user } as const;

  const colecciones = payload.config.collections.filter((c) => puedeLeer(c.slug));
  const globales = payload.config.globals.filter(
    (g) =>
      visibles.globals.includes(g.slug) &&
      Boolean(permissions.globals?.[g.slug as GlobalSlug]?.read),
  );

  // Un fallo de una consulta no tumba la portada: ese dato sale vacío.
  const seguro = async <T>(etiqueta: string, f: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await f();
    } catch (error) {
      console.error(`[portada] no se pudo calcular «${etiqueta}»:`, error);
      return undefined;
    }
  };
  const contar = (slug: string, where?: Where) =>
    seguro(
      `contador ${slug}`,
      async () =>
        (
          await payload.count({
            collection: slug as CollectionSlug,
            ...(where ? { where } : {}),
            ...acceso,
          })
        ).totalDocs,
    );

  const [totales, nuevas, disponibles, sinFotos, rotas, altFlojos, recientesCol, recientesGlob] =
    await Promise.all([
      Promise.all(colecciones.map(async (c) => [c.slug, await contar(c.slug)] as const)),
      puedeLeer("solicitudes") ? contar("solicitudes", { estado: { equals: "nueva" } }) : undefined,
      puedeLeer("equipos-usados")
        ? contar("equipos-usados", { disponible: { equals: true } })
        : undefined,
      Promise.all(
        CON_GALERIA.filter(puedeLeer).map(
          async (slug) => [slug, await contar(slug, { imagenes: { exists: false } })] as const,
        ),
      ),
      puedeLeer("redirects")
        ? contar("redirects", { estadoDestino: { equals: "sin-ruta" } })
        : undefined,
      puedeLeer("media")
        ? seguro("textos alternativos", async () => {
            const { docs } = await payload.find({
              collection: "media",
              depth: 0,
              pagination: false,
              select: { alt: true, filename: true },
              ...acceso,
            });
            return docs.filter((d) => motivoAltFlojo(d.alt, d.filename)).length;
          })
        : undefined,
      Promise.all(
        colecciones
          .filter((c) => !FUERA_DE_RECIENTES.has(c.slug))
          .map((c) =>
            seguro(`recientes ${c.slug}`, async () => {
              const campo = c.admin?.useAsTitle ?? (c.upload ? "filename" : "id");
              const { docs } = await payload.find({
                collection: c.slug as CollectionSlug,
                depth: 0,
                limit: 5,
                sort: "-updatedAt",
                select: { [campo]: true, updatedAt: true },
                ...acceso,
              });
              const coleccion = texto(c.labels?.plural, c.slug);
              return docs.map((d): Reciente => ({
                slug: c.slug,
                coleccion,
                titulo: texto((d as unknown as Record<string, unknown>)[campo], `#${d.id}`),
                href: `/admin/collections/${c.slug}/${d.id}`,
                actualizado: texto((d as { updatedAt?: unknown }).updatedAt, ""),
              }));
            }),
          ),
      ),
      Promise.all(
        globales.map((g) =>
          seguro(`recientes ${g.slug}`, async () => {
            const doc = await payload.findGlobal({
              slug: g.slug as GlobalSlug,
              depth: 0,
              select: { updatedAt: true },
              ...acceso,
            });
            const etiqueta = texto(g.label, g.slug);
            return [
              {
                slug: g.slug,
                coleccion: "Partes del sitio y configuración",
                titulo: etiqueta,
                href: rutaGlobal(g.slug),
                actualizado: texto((doc as { updatedAt?: unknown }).updatedAt, ""),
              } satisfies Reciente,
            ];
          }),
        ),
      ),
    ]);

  const contadores = Object.fromEntries(totales);
  const detalles: Record<string, string | undefined> = {
    solicitudes:
      nuevas !== undefined ? `${nuevas} ${nuevas === 1 ? "nueva" : "nuevas"}` : undefined,
    "equipos-usados":
      disponibles !== undefined
        ? `${disponibles} ${disponibles === 1 ? "disponible" : "disponibles"}`
        : undefined,
  };

  const entidades: EntidadPortada[] = [
    ...colecciones.map((c) => ({
      slug: c.slug,
      tipo: "collection" as const,
      etiqueta: texto(c.labels?.plural, c.slug),
      grupo: texto(c.admin?.group, "Otros"),
      puedeCrear: Boolean(permissions.collections?.[c.slug as CollectionSlug]?.create),
    })),
    ...globales.map((g) => ({
      slug: g.slug,
      tipo: "global" as const,
      etiqueta: texto(g.label, g.slug),
      grupo: texto(g.admin?.group, "Otros"),
      puedeCrear: false,
    })),
  ];

  const etiquetas: Partial<Record<ConGaleria, string>> = {};
  for (const c of colecciones) {
    if ((CON_GALERIA as readonly string[]).includes(c.slug)) {
      etiquetas[c.slug as ConGaleria] = texto(c.labels?.plural, c.slug);
    }
  }

  return {
    avisos: avisosDePortada({
      sinFotos: Object.fromEntries(sinFotos),
      etiquetas,
      altFlojos,
      solicitudesNuevas: nuevas,
      redireccionesRotas: rotas,
      indexacionPermitida: indexacionPermitida(),
    }),
    tarjetas: tarjetasDePortada(entidades, contadores, detalles),
    recientes: ultimosModificados([
      ...recientesCol.map((r) => r ?? []),
      ...recientesGlob.map((r) => r ?? []),
    ]),
  };
}
