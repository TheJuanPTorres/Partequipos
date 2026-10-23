import type { TextFieldSingleValidation } from "payload";
import { text } from "payload/shared";

import { normalizarRuta } from "../redirects/normalizar";
import { rutas } from "../routes";

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

/** El mensaje cuando una redirección guardada sale de la dirección de la categoría. */
export const mensajeRedireccionTapa = (desde: string): string =>
  `Hay una redirección desde ${desde}/ (en «Redirecciones»): taparía esta categoría y nadie llegaría a ella. Bórrala o cambia su destino a esta categoría antes de guardar.`;

/**
 * La validación del campo «Dirección web» de las categorías de nueva: la de arriba y, además, que
 * ninguna redirección guardada salga de su URL (2026-10-23, tarea 9). El proxy aplica las
 * redirecciones antes que las páginas, así que una categoría nueva con la dirección de un 301
 * antiguo (`/…/nueva/miniexcavadoras/` → Yanmar, de la limpieza del panel) quedaría tapada sin
 * ningún error. Con esto el panel no deja crearla hasta quitar o cambiar ese 301.
 */
export const slugCategoriaNuevaValido: TextFieldSingleValidation = async (valor, args) => {
  const base = slugCategoriaNuevaNoReservado(valor, args);
  if (base !== true || typeof valor !== "string") return base;
  const desde = normalizarRuta(rutas.categoriaNueva(valor.trim().toLowerCase()));
  const { totalDocs } = await args.req.payload.count({
    collection: "redirects",
    where: { desde: { equals: desde } },
    overrideAccess: true,
    req: args.req,
  });
  return totalDocs > 0 ? mensajeRedireccionTapa(desde) : true;
};
