import type { CollectionBeforeOperationHook } from "payload";

/**
 * JOINS SOLO EN EL PANEL (orden por arrastre de repuestos, 2026-11-19).
 *
 * Un campo `join` (los tipos de una marca, los modelos de un tipo) lo rellena Payload en CADA
 * lectura de la colección, también en las del sitio: cada página de marca o de tipo cargaría
 * de paso hasta cien filas que no pinta. Los joins existen para ORDENAR ARRASTRANDO en el panel,
 * así que fuera de él se apagan: una lectura sin usuario (las consultas del sitio con la API local
 * y las de los runbooks con el token de lectura) va con `joins: false`, salvo que la consulta pida
 * sus joins expresamente. El panel siempre lee con su usuario.
 *
 * Depende de Payload 3.89: `beforeOperation` corre antes de leer `args.joins` en `find` y
 * `findByID` (`payload/dist/collections/operations/find.js`). Lo vigila `joinsSoloEnElPanel.test.ts`.
 */
export const joinsSoloEnElPanel: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== "read" || req.user) return args;
  if ((args as { joins?: unknown }).joins !== undefined) return args;
  return { ...args, joins: false };
};
