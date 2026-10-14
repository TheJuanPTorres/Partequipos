import type { TextFieldSingleValidation } from "payload";
import { text } from "payload/shared";

/**
 * DIRECCIONES WEB RESERVADAS en las categorías de usada (decisión D1,
 * 2026-10-13).
 *
 * Las marcas de usada viven en `/maquinaria-pesada/maquinaria-pesada-usada/
 * marcas/<marca>/`. En Next, el segmento fijo `marcas` gana a `[categoria]`:
 * una categoría con la dirección `marcas` quedaría tapada sin ningún error.
 */
export const SLUGS_RESERVADOS_CATEGORIA_USADA: ReadonlySet<string> = new Set(["marcas"]);

export const MENSAJE_SLUG_RESERVADO =
  "Esa dirección web está reservada: la usa la página de las marcas de usados. Elige otra.";

/**
 * Validación del campo «Dirección web» de las categorías de usada: la de
 * Payload (obligatorio…) y, además, que no sea una reservada. Una `validate`
 * propia sustituye a la de Payload, por eso se la llama.
 */
export const slugCategoriaUsadaNoReservado: TextFieldSingleValidation = (valor, args) =>
  typeof valor === "string" && SLUGS_RESERVADOS_CATEGORIA_USADA.has(valor.trim().toLowerCase())
    ? MENSAJE_SLUG_RESERVADO
    : text(valor, args);
