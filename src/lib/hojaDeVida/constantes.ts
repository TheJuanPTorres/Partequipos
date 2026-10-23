/**
 * LA HOJA DE VIDA («Enviar HV», `/nosotros/trabaja-con-nosotros/`, 2026-10-23): límites y textos
 * que comparten el formulario (navegador) y el servidor. SIN Zod: lo importa un componente de
 * cliente (`clienteSinZod.test.ts`).
 *
 * TOPE DE 4 MB: la petición pasa por una función de Vercel, que corta el cuerpo en 4,5 MB en todos
 * los planes (§10.39); con los demás campos del formulario, 4 MB de PDF es lo más que cabe sin
 * arriesgar un 413 que el usuario vería en inglés.
 */
export const MAX_PDF_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_MB = 4;

export const MAX_HV = {
  nombre: 120,
  correo: 200,
  telefono: 40,
  vacante: 200,
  ciudad: 100,
  mensaje: 2000,
} as const;

/** La política con la que se autoriza el tratamiento de los datos (Ley 1581 de 2012). */
export const RUTA_POLITICA_DATOS = "/tratamiento-de-datos/";

/** Dónde se envía la hoja de vida (ruta de la API, con barra final por `trailingSlash`). */
export const RUTA_API_HV = "/api/hoja-de-vida/";

export type ErroresHv = Partial<Record<string, string>>;

export type RespuestaHv =
  { ok: true; mensaje: string } | { ok: false; mensaje: string; errores?: ErroresHv };
