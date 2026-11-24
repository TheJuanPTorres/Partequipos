import type {
  CollectionSlug,
  GlobalSlug,
  Payload,
  SanitizedPermissions,
  TypedUser,
  Where,
} from "payload";

import { CAMPO_ULTIMO_EDITOR } from "../fields/ultimoEditor";
import { motivoAltFlojo } from "../media/altFlojo";
import { ANCHO_MINIMO } from "../panel/fotoPequena";
import {
  accionesHabituales,
  avisosDePortada,
  cifrasDePortada,
  editadosPorMi,
  type Cifra,
  CON_GALERIA,
  FILTRO_SOLICITUDES_NUEVAS,
  FUERA_DE_RECIENTES,
  mensajesRecientes,
  rutaGlobal,
  tarjetasDePortada,
  etiquetaEditor,
  ultimosModificados,
  WHERE_SIN_DESCRIPCION,
  WHERE_SIN_SEO,
  type AvisoPortada,
  type ConGaleria,
  type EntidadPortada,
  type Habitual,
  type Mensaje,
  type Permiso,
  type Reciente,
  type Tarjeta,
} from "../panel/portada";
import { indexacionPermitida } from "../seo/config";
import { SLUG_PORTADA } from "./getPaginas";

type Visibles = { collections: string[]; globals: string[] };

export type DatosPortada = {
  avisos: AvisoPortada[];
  /** Tablero (tanda 23): las cifras de arriba. */
  cifras: Cifra[];
  /** Tablero (tanda 23): lo último que guardó quien mira. */
  mios: Reciente[];
  tarjetas: Tarjeta[];
  recientes: Reciente[];
  habituales: Habitual[];
  /** `undefined` si el rol no ve las solicitudes: entonces la sección no sale. */
  mensajes?: { lista: Mensaje[]; todas: string };
  /** El manual del editor (un PDF de «Documentos» con `guia-editor` en el nombre), si está subido. */
  manual?: string;
};

/** Las solicitudes nuevas que se enseñan en «Mensajes». */
const MENSAJES_EN_PORTADA = 5;

const texto = (v: unknown, respaldo: string) => (typeof v === "string" && v ? v : respaldo);

/** Las etiquetas de las opciones de un `select` de primer nivel, por su valor (de la config). */
function etiquetasDeOpciones(
  payload: Payload,
  slug: string,
  campo: string,
): Record<string, string> {
  const col = payload.config.collections.find((c) => c.slug === slug);
  const f = col?.flattenedFields.find((x) => x.name === campo);
  if (!f || f.type !== "select") return {};
  return Object.fromEntries(
    f.options.map((o) => (typeof o === "string" ? [o, o] : [o.value, texto(o.label, o.value)])),
  );
}

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
 * de Imágenes. De «solicitudes», además de contarlas, se leen las 5 nuevas más
 * recientes con solo su nombre, tipo y fecha («Mensajes», fase 2, PR 6). Las
 * fotos pequeñas leen solo los ids de las galerías (`select: imagenes`) y
 * cuentan en Imágenes las de menos de 1.200 px.
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

  const galerias = CON_GALERIA.filter(puedeLeer);
  const porColeccion = (where: Where) =>
    Promise.all(galerias.map(async (slug) => [slug, await contar(slug, where)] as const));

  const [
    sinDescripcion,
    sinSeo,
    incompletas,
    fotosPequenas,
    busquedas,
    mensajes,
    idPortada,
    manual,
    tiposSolicitud,
  ] = await Promise.all([
    porColeccion(WHERE_SIN_DESCRIPCION),
    porColeccion(WHERE_SIN_SEO),
    // Tablero: sin fotos O sin descripción, para que cada ficha cuente una vez.
    porColeccion({ or: [{ imagenes: { exists: false } }, WHERE_SIN_DESCRIPCION] }),
    // Fotos pequeñas EN USO en las galerías de las fichas: los ids de sus galerías y, de esas,
    // cuántas miden menos de 1.200 px de ancho.
    puedeLeer("media") && galerias.length
      ? seguro("fotos pequeñas", async () => {
          const ids = new Set<number>();
          for (const slug of galerias) {
            const { docs } = await payload.find({
              collection: slug,
              depth: 0,
              pagination: false,
              select: { imagenes: true },
              ...acceso,
            });
            for (const d of docs) {
              for (const v of ((d as { imagenes?: unknown }).imagenes as unknown[] | undefined) ??
                []) {
                const id = typeof v === "object" && v ? (v as { id?: unknown }).id : v;
                if (typeof id === "number") ids.add(id);
              }
            }
          }
          if (!ids.size) return 0;
          return (
            await payload.count({
              collection: "media",
              where: {
                and: [{ id: { in: [...ids] } }, { width: { less_than: ANCHO_MINIMO } }],
              },
              ...acceso,
            })
          ).totalDocs;
        })
      : undefined,
    puedeLeer("busquedas-sin-resultado") ? contar("busquedas-sin-resultado") : undefined,
    puedeLeer("solicitudes")
      ? seguro("mensajes", async () => {
          const { docs } = await payload.find({
            collection: "solicitudes",
            depth: 0,
            limit: MENSAJES_EN_PORTADA,
            sort: "-createdAt",
            where: { estado: { equals: "nueva" } },
            select: { nombre: true, tipo: true, createdAt: true },
            ...acceso,
          });
          return docs;
        })
      : undefined,
    puedeLeer("paginas")
      ? seguro("página de la portada", async () => {
          const { docs } = await payload.find({
            collection: "paginas",
            depth: 0,
            limit: 1,
            where: { slug: { equals: SLUG_PORTADA } },
            select: { slug: true },
            ...acceso,
          });
          return docs[0]?.id;
        })
      : undefined,
    puedeLeer("documentos")
      ? seguro("manual", async () => {
          const { docs } = await payload.find({
            collection: "documentos",
            depth: 0,
            limit: 1,
            sort: "-updatedAt",
            where: { filename: { contains: "guia-editor" } },
            select: { url: true, filename: true },
            ...acceso,
          });
          const url = (docs[0] as { url?: unknown } | undefined)?.url;
          return typeof url === "string" && url ? url : undefined;
        })
      : Promise.resolve(undefined),
    Promise.resolve(etiquetasDeOpciones(payload, "solicitudes", "tipo")),
  ]);

  // «Lo último que editaste» (tablero): en cada colección con último editor, lo que guardó quien mira.
  const conUltimoEditor = colecciones.filter(
    (c) =>
      !FUERA_DE_RECIENTES.has(c.slug) &&
      c.fields.some((f) => "name" in f && f.name === CAMPO_ULTIMO_EDITOR),
  );
  const mios = await Promise.all(
    conUltimoEditor.map((c) =>
      seguro(`míos ${c.slug}`, async () => {
        const campo = c.admin?.useAsTitle ?? (c.upload ? "filename" : "id");
        const { docs } = await payload.find({
          collection: c.slug as CollectionSlug,
          depth: 0,
          limit: 3,
          sort: "-updatedAt",
          where: { [CAMPO_ULTIMO_EDITOR]: { equals: user.id } },
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
          editor: "ti",
        }));
      }),
    ),
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
              // Último editor (§25), poblado solo si el rol puede leer a ese
              // usuario (depth 1 sobre lo seleccionado, con su acceso).
              const conEditor = c.fields.some((f) => "name" in f && f.name === CAMPO_ULTIMO_EDITOR);
              const { docs } = await payload.find({
                collection: c.slug as CollectionSlug,
                depth: conEditor ? 1 : 0,
                limit: 5,
                sort: "-updatedAt",
                select: {
                  [campo]: true,
                  updatedAt: true,
                  ...(conEditor ? { [CAMPO_ULTIMO_EDITOR]: true } : {}),
                },
                ...acceso,
              });
              const coleccion = texto(c.labels?.plural, c.slug);
              return docs.map((d): Reciente => ({
                slug: c.slug,
                coleccion,
                titulo: texto((d as unknown as Record<string, unknown>)[campo], `#${d.id}`),
                href: `/admin/collections/${c.slug}/${d.id}`,
                actualizado: texto((d as { updatedAt?: unknown }).updatedAt, ""),
                editor: etiquetaEditor(
                  (d as unknown as Record<string, unknown>)[CAMPO_ULTIMO_EDITOR],
                  user.id,
                ),
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
                // Los globales no llevan último editor (§25): «—».
                editor: "—",
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
    cifras: cifrasDePortada({
      solicitudesNuevas: nuevas,
      incompletas: Object.fromEntries(
        incompletas.filter(([, n]) => n !== undefined) as [ConGaleria, number][],
      ),
      fotosPequenas,
      busquedasSinResultado: busquedas,
    }),
    mios: editadosPorMi(mios.map((m) => m ?? [])),
    avisos: avisosDePortada({
      sinFotos: Object.fromEntries(sinFotos),
      etiquetas,
      altFlojos,
      solicitudesNuevas: nuevas,
      redireccionesRotas: rotas,
      sinDescripcion: Object.fromEntries(sinDescripcion),
      sinSeo: Object.fromEntries(sinSeo),
      fotosPequenas,
      busquedasSinResultado: busquedas,
      indexacionPermitida: indexacionPermitida(),
    }),
    habituales: accionesHabituales((slug, permiso: Permiso) => {
      if (!visibles.collections.includes(slug)) return false;
      return Boolean(permissions.collections?.[slug as CollectionSlug]?.[permiso]);
    }, idPortada),
    mensajes: mensajes
      ? {
          lista: mensajesRecientes(mensajes, tiposSolicitud),
          todas: `/admin/collections/solicitudes${FILTRO_SOLICITUDES_NUEVAS}`,
        }
      : undefined,
    manual,
    tarjetas: tarjetasDePortada(entidades, contadores, detalles),
    recientes: ultimosModificados([
      ...recientesCol.map((r) => r ?? []),
      ...recientesGlob.map((r) => r ?? []),
    ]),
  };
}
