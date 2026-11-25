import type { CollectionBeforeOperationHook, CollectionConfig, Where } from "payload";

/**
 * BORRADORES Y VERSIONES (2026-11-19, dirección; informe del panel §4, PR 8).
 *
 * Los artículos del blog guardan versiones y admiten borradores: el editor prepara un cambio con «Guardar borrador» sin que se vea en la
 * web, lo publica cuando está listo y puede volver a una versión anterior.
 *
 * Las páginas (portada, Servicio técnico…) llegan en un PR posterior, junto con la vista previa
 * del borrador en la web y el renombrado de 4 campos cuyos nombres pasarían de 63 bytes en sus
 * tablas de versiones (dirección, 2026-11-19). Al añadirlas, entran en COLECCIONES_CON_BORRADORES.
 *
 * Cómo lo guarda Payload 3.89 (leído en `collections/operations/utilities/update.js`):
 * - Guardar un borrador de algo YA publicado escribe solo en la tabla de versiones
 *   (`_articulos_v`): la fila de la tabla principal, que es la que lee la web, no cambia.
 * - Un documento creado como borrador, o despublicado, sí está en la tabla principal, con
 *   `_status = 'draft'`. Por eso TODA consulta pública de estas colecciones filtra con
 *   `soloPublicado` (la API local no pasa por el control de acceso): lo vigila
 *   `borradores.test.ts`.
 */
export const COLECCIONES_CON_BORRADORES = ["articulos", "paginas"] as const;

/** Las versiones que se guardan por documento (las más antiguas se borran solas). */
export const MAXIMO_VERSIONES = 25;

export const VERSIONES_CON_BORRADORES: NonNullable<CollectionConfig["versions"]> = {
  // Sin guardado automático: el borrador se guarda cuando el editor lo pide.
  drafts: { autosave: false },
  maxPerDoc: MAXIMO_VERSIONES,
};

/**
 * HISTORIAL SIN BORRADORES (tanda 21, tarea 3, fase 2, punto 4) para las fichas de producto: cada
 * guardado deja una versión (fecha y quién), que se compara campo a campo y se restaura. Sin
 * borradores: lo que se guarda se publica, como siempre. Las 10 últimas por ficha; el historial,
 * solo con sesión del personal (`readVersions: soloPersonal`).
 */
export const MAXIMO_VERSIONES_PRODUCTO = 10;
export const VERSIONES_SIN_BORRADORES: NonNullable<CollectionConfig["versions"]> = {
  drafts: false,
  maxPerDoc: MAXIMO_VERSIONES_PRODUCTO,
};

/** ¿La consulta filtra por `parent`? Solo existe en las tablas de versiones (`_<colección>_v`). */
function filtraPorParent(where: unknown): boolean {
  if (!where || typeof where !== "object") return false;
  if (Array.isArray(where)) return where.some(filtraPorParent);
  return Object.entries(where).some(
    ([clave, valor]) => clave === "parent" || filtraPorParent(valor),
  );
}

/**
 * LA LISTA DE VERSIONES, LA MÁS RECIENTE PRIMERO (2026-11-24, dirección). Payload 3.89 pide las
 * versiones sin orden y el adaptador cae al `defaultSort` de la colección, que no es la fecha: en la
 * lista salían mezcladas. Si nadie pide otro orden (pulsando una columna), se ordena por
 * `-updatedAt`, la fecha que pinta la lista. Lo vigila `versionesProducto.test.ts`.
 *
 * OJO, Payload 3.89 NO pasa `findVersions` al gancho: lo traduce a `read`, igual que `find`
 * (`operationToHookOperation` en `collections/operations/utilities/types.js`; el #578 miraba
 * «findVersions» y nunca ordenaba). Se reconoce porque la vista del historial filtra por `parent`,
 * un campo que solo tienen las versiones (ninguna de estas colecciones tiene un campo `parent`).
 */
export const versionesRecientesPrimero: CollectionBeforeOperationHook = ({ args, operation }) =>
  operation === "read" &&
  "where" in args &&
  !("sort" in args && args.sort) &&
  filtraPorParent(args.where)
    ? { ...args, sort: "-updatedAt" }
    : args;

/** La condición de lo publicado. */
export const PUBLICADO = { _status: { equals: "published" } } satisfies Where;

/** Una consulta pública de artículos: solo lo publicado, con la condición que traiga. */
export function soloPublicado(where?: Where): Where {
  return where ? { and: [PUBLICADO, where] } : PUBLICADO;
}

/**
 * Lo que se crea sin decir su estado (un script, un importador, un runbook) nace PUBLICADO, como
 * antes de los borradores. Sin esto nacería borrador (el valor por defecto de `_status` en Payload
 * es `'draft'`) y no saldría en la web. El panel siempre manda el estado: «Publicar» manda
 * `published` y «Guardar borrador» pide `draft`.
 */
export const nacePublicado: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation !== "create" || args.draft) return args;
  const data = args.data as Record<string, unknown> | undefined;
  if (data && data._status === undefined) data._status = "published";
  return args;
};
