import type { CollectionBeforeOperationHook, CollectionConfig, Where } from "payload";

/**
 * BORRADORES Y VERSIONES (2026-11-19, dirección; informe del panel §4, PR 8).
 *
 * Las páginas (la portada, Servicio técnico, Nosotros…) y los artículos del blog guardan versiones
 * y admiten borradores: el editor prepara un cambio con «Guardar borrador» sin que se vea en la
 * web, lo publica cuando está listo y puede volver a una versión anterior.
 *
 * Cómo lo guarda Payload 3.89 (leído en `collections/operations/utilities/update.js`):
 * - Guardar un borrador de algo YA publicado escribe solo en la tabla de versiones
 *   (`_paginas_v`…): la fila de la tabla principal, que es la que lee la web, no cambia.
 * - Un documento creado como borrador, o despublicado, sí está en la tabla principal, con
 *   `_status = 'draft'`. Por eso TODA consulta pública de estas colecciones filtra con
 *   `soloPublicado` (la API local no pasa por el control de acceso): lo vigila
 *   `borradores.test.ts`.
 */
export const COLECCIONES_CON_BORRADORES = ["paginas", "articulos"] as const;

/** Las versiones que se guardan por documento (las más antiguas se borran solas). */
export const MAXIMO_VERSIONES = 25;

export const VERSIONES_CON_BORRADORES: NonNullable<CollectionConfig["versions"]> = {
  // Sin guardado automático: el borrador se guarda cuando el editor lo pide.
  drafts: { autosave: false },
  maxPerDoc: MAXIMO_VERSIONES,
};

/** La condición de lo publicado. */
export const PUBLICADO = { _status: { equals: "published" } } satisfies Where;

/** Una consulta pública de páginas o artículos: solo lo publicado, con la condición que traiga. */
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
