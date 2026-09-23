/**
 * Reglas puras de los campos de la portada (fase B de la home de ux-9), para
 * poder probarlas sin Payload.
 */

/**
 * Enlace de un campo editable: ruta interna (`/contactanos/`) o `https://`.
 * Se rechaza `//otro.com` (URL relativa al protocolo: sale del sitio aunque
 * empiece por barra) y cualquier otro esquema (`javascript:`, `http:`).
 */
export function validarEnlace(valor: unknown): true | string {
  if (valor === undefined || valor === null || valor === "") return true;
  if (typeof valor !== "string") return "El enlace tiene que ser texto.";
  const v = valor.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  if (/^https:\/\/[^\s/]+\.[^\s]+$/i.test(v)) return true;
  return "Usa una ruta del sitio que empiece por «/» (p. ej. /contactanos/) o una dirección https://.";
}

/** Coordenadas de una sede. */
export function validarLatitud(valor: unknown): true | string {
  return typeof valor === "number" && valor >= -90 && valor <= 90
    ? true
    : "La latitud va de −90 a 90 (Colombia: entre −5 y 13).";
}

export function validarLongitud(valor: unknown): true | string {
  return typeof valor === "number" && valor >= -180 && valor <= 180
    ? true
    : "La longitud va de −180 a 180 (Colombia: entre −82 y −66).";
}

/*
 * TESTIMONIOS — un testimonio no se publica sin autorización de uso
 * (docs/diseno/decisiones-home-ux9.md, licencia L4; Ley 1581 de 2012).
 */

/** Validación del campo `publicado`: no se puede marcar sin autorización. */
export function validarPublicacionTestimonio(
  publicado: unknown,
  autorizacionUso: unknown,
): true | string {
  if (publicado !== true) return true;
  return autorizacionUso === true
    ? true
    : "No se puede publicar sin la autorización de uso marcada: el testimonio es de una persona real.";
}

/**
 * Estado que se GUARDA. Aunque la validación falle o se salte (API local con
 * datos a mano), el servidor nunca deja publicado un testimonio sin
 * autorización: si se retira la autorización, se despublica.
 */
export function publicadoEfectivo(publicado: unknown, autorizacionUso: unknown): boolean {
  return publicado === true && autorizacionUso === true;
}

/**
 * Lo que puede leer quien NO es personal del panel. Se exporta para que las
 * consultas de la API local —que por defecto se saltan el control de acceso—
 * usen exactamente el mismo filtro.
 */
export const TESTIMONIOS_PUBLICOS = {
  and: [{ publicado: { equals: true } }, { autorizacionUso: { equals: true } }],
} as const;
