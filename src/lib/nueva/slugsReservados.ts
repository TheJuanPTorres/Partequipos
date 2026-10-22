import type { TextFieldSingleValidation } from "payload";
import { text } from "payload/shared";

/**
 * DIRECCIONES WEB RESERVADAS en las categorías de maquinaria NUEVA.
 *
 * Las categorías viven en `/maquinaria-pesada/maquinaria-pesada-nueva/<categoria>/`, al mismo
 * nivel que tres segmentos fijos: `marcas` (el índice de marcas), `tipos` (el índice de tipos,
 * 2026-10-22) y `pagina` (las URL del antiguo listado, que dan 301 al índice). En Next, un
 * segmento fijo gana a `[categoria]`: una categoría con una de esas direcciones quedaría tapada
 * sin ningún error.
 */
export const SLUGS_RESERVADOS_CATEGORIA_NUEVA: ReadonlySet<string> = new Set([
  "marcas",
  "tipos",
  "pagina",
]);

export const MENSAJE_SLUG_RESERVADO_NUEVA =
  "Esa dirección web está reservada: la usa otra página de maquinaria nueva («marcas», «tipos» o «pagina»). Elige otra.";

/** La validación de Payload (obligatorio…) y, además, que no sea una reservada. */
export const slugCategoriaNuevaNoReservado: TextFieldSingleValidation = (valor, args) =>
  typeof valor === "string" && SLUGS_RESERVADOS_CATEGORIA_NUEVA.has(valor.trim().toLowerCase())
    ? MENSAJE_SLUG_RESERVADO_NUEVA
    : text(valor, args);
